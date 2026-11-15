<?php

namespace App\Services\Push;

use App\Models\DeviceToken;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Servicio de notificaciones Push mediante Firebase Cloud Messaging (HTTP v1 API)
 * y soporte híbrido para tokens de Expo Push.
 */
class FcmService
{
    private const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

    /**
     * Envía una notificación push a todos los dispositivos registrados del usuario.
     *
     * @param  array<string, string>  $data
     * @return array{sent: int, failed: int, skipped: int}
     */
    public function sendToUser(User $user, string $title, string $body, array $data = []): array
    {
        $this->enqueueForApp($user, $title, $body, $data);

        $tokens = $user->deviceTokens()->get();
        $stats = ['sent' => 0, 'failed' => 0, 'skipped' => 0];

        if ($tokens->isEmpty()) {
            return $stats;
        }

        foreach ($tokens as $deviceToken) {
            $result = $this->sendToToken($deviceToken, $title, $body, $data);
            $stats[$result]++;
        }

        return $stats;
    }

    /**
     * Encola la notificación para entrega inmediata en tiempo real a dispositivos
     * en emulador / Expo Go, además del envío por Firebase FCM HTTP v1.
     *
     * @param  array<string, string>  $data
     */
    public function enqueueForApp(User $user, string $title, string $body, array $data = []): void
    {
        $key = "push_inbox.{$user->id}";
        $items = Cache::get($key, []);
        if (! is_array($items)) {
            $items = [];
        }
        $items[] = [
            'id' => uniqid('push_', true),
            'title' => $title,
            'body' => $body,
            'level' => $data['level'] ?? 'info',
            'type' => $data['type'] ?? 'push',
            'sent_at' => now()->toIso8601String(),
        ];
        Cache::put($key, array_slice($items, -20), now()->addHours(2));
    }

    /**
     * Extrae y limpia las notificaciones pendientes del buzón del usuario.
     *
     * @return array<int, array<string, mixed>>
     */
    public function pullInbox(User $user): array
    {
        $key = "push_inbox.{$user->id}";
        $items = Cache::pull($key, []);

        return is_array($items) ? $items : [];
    }

    /**
     * Envía una notificación a un token específico (FCM HTTP v1 o Expo Push Service).
     *
     * @param  array<string, string>  $data
     * @return 'sent'|'failed'|'skipped'
     */
    public function sendToToken(DeviceToken $device, string $title, string $body, array $data = []): string
    {
        $stringData = array_map(fn ($v) => (string) $v, $data);

        if (str_starts_with($device->token, 'ExponentPushToken[') || str_starts_with($device->token, 'ExpoPushToken[')) {
            return $this->sendViaExpo($device, $title, $body, $stringData);
        }

        $credentials = $this->loadCredentials();
        if (! $credentials) {
            return 'skipped';
        }

        $accessToken = $this->getAccessToken($credentials);
        if (! $accessToken) {
            return 'failed';
        }

        $projectId = $credentials['project_id'] ?? config('services.fcm.project_id', 'lifesync-mobile');
        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

        $payload = [
            'message' => [
                'token' => $device->token,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                ],
                'data' => $stringData + ['title' => $title, 'body' => $body],
                'android' => [
                    'priority' => 'HIGH',
                    'notification' => [
                        'channel_id' => 'lifesync_alerts',
                        'sound' => 'default',
                    ],
                ],
                'apns' => [
                    'headers' => [
                        'apns-priority' => '10',
                    ],
                    'payload' => [
                        'aps' => [
                            'sound' => 'default',
                            'content-available' => 1,
                        ],
                    ],
                ],
            ],
        ];

        try {
            $response = Http::withToken($accessToken)
                ->timeout(8)
                ->post($url, $payload);

            if ($response->successful()) {
                return 'sent';
            }

            // Si el token ya no es válido en FCM, lo eliminamos automáticamente
            $errorCode = $response->json('error.details.0.errorCode') ?? $response->json('error.status');
            if ($response->status() === 404 || in_array($errorCode, ['UNREGISTERED', 'INVALID_ARGUMENT'], true)) {
                $device->delete();
            }

            Log::warning('FCM push falló', [
                'status' => $response->status(),
                'error' => $errorCode,
            ]);

            return 'failed';
        } catch (Throwable $e) {
            Log::warning('Excepción enviando FCM push', ['message' => $e->getMessage()]);

            return 'failed';
        }
    }

    /**
     * @param  array<string, string>  $data
     * @return 'sent'|'failed'
     */
    private function sendViaExpo(DeviceToken $device, string $title, string $body, array $data): string
    {
        try {
            $response = Http::timeout(8)->post('https://exp.host/--/api/v2/push/send', [
                'to' => $device->token,
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'priority' => 'high',
                'channelId' => 'lifesync_alerts',
                'data' => $data,
            ]);

            return $response->successful() ? 'sent' : 'failed';
        } catch (Throwable) {
            return 'failed';
        }
    }

    /**
     * Genera u obtiene de caché el OAuth2 Access Token de Google usando la cuenta de servicio.
     *
     * @param  array<string, mixed>  $credentials
     */
    public function getAccessToken(array $credentials): ?string
    {
        $cacheKey = 'fcm.oauth_token.'.md5((string) ($credentials['client_email'] ?? 'default'));

        return Cache::remember($cacheKey, now()->addMinutes(50), function () use ($credentials) {
            $now = time();
            $tokenUri = (string) ($credentials['token_uri'] ?? 'https://oauth2.googleapis.com/token');

            $assertion = JWT::encode([
                'iss' => $credentials['client_email'],
                'sub' => $credentials['client_email'],
                'aud' => $tokenUri,
                'iat' => $now,
                'exp' => $now + 3600,
                'scope' => self::SCOPE,
            ], (string) $credentials['private_key'], 'RS256');

            $response = Http::asForm()->timeout(8)->post($tokenUri, [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $assertion,
            ]);

            if (! $response->successful()) {
                return null;
            }

            return $response->json('access_token');
        });
    }

    /**
     * Carga las credenciales de Firebase Admin SDK desde el archivo configurado.
     *
     * @return array<string, mixed>|null
     */
    public function loadCredentials(): ?array
    {
        $path = $this->resolveCredentialsPath();
        if (! $path || ! is_file($path) || ! is_readable($path)) {
            return null;
        }

        $decoded = json_decode((string) file_get_contents($path), true);
        if (! is_array($decoded) || empty($decoded['client_email']) || empty($decoded['private_key'])) {
            return null;
        }

        return $decoded;
    }

    private function resolveCredentialsPath(): ?string
    {
        $configured = (string) config('services.fcm.credentials', '');
        if ($configured !== '') {
            if (str_starts_with($configured, '/') && is_file($configured)) {
                return $configured;
            }
            $fromBase = base_path($configured);
            if (is_file($fromBase)) {
                return $fromBase;
            }
        }

        $default = storage_path('app/firebase-service-account.json');

        return is_file($default) ? $default : null;
    }
}
