<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use App\Models\User;
use App\Services\Push\FcmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PushTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'min:16', 'max:512', 'regex:/^[A-Za-z0-9:_.\-\[\]]+$/'],
            'platform' => ['sometimes', 'string', Rule::in(DeviceToken::PLATFORMS)],
        ]);

        $device = DeviceToken::updateOrCreate(
            ['token' => $data['token']],
            [
                'user_id' => $request->user()->id,
                'platform' => $data['platform'] ?? 'android',
            ]
        );

        return response()->json($device, 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:512'],
        ]);

        $request->user()->deviceTokens()->where('token', $data['token'])->delete();

        return response()->json(null, 204);
    }

    /**
     * Endpoint autenticado para disparar una notificación push de prueba al usuario actual.
     */
    public function test(Request $request, FcmService $fcm): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:120', 'not_regex:/[<>]/'],
            'body' => ['sometimes', 'string', 'max:255', 'not_regex:/[<>]/'],
            'level' => ['sometimes', 'string', Rule::in(['info', 'warning', 'critical'])],
        ]);

        $title = $data['title'] ?? '🔔 LifeSync Push Activo';
        $body = $data['body'] ?? 'Tus notificaciones de emergencia médica están configuradas correctamente.';
        $level = $data['level'] ?? 'info';

        $stats = $fcm->sendToUser($request->user(), $title, $body, [
            'type' => 'test',
            'level' => $level,
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'Notificación push enviada.',
            'project_id' => config('services.fcm.project_id', 'lifesync-mobile'),
            'firebase_ready' => $fcm->loadCredentials() !== null,
            'stats' => $stats,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'level' => $level,
            ],
        ]);
    }

    /**
     * Endpoint de prueba rápida (GET/POST /api/push/test o /api/push/send)
     * para probar el envío de Push Notifications desde navegador, cURL o Postman.
     */
    public function sendTestPublic(Request $request, FcmService $fcm): JsonResponse
    {
        $data = $request->validate([
            'email' => ['sometimes', 'email'],
            'user_id' => ['sometimes', 'integer'],
            'token' => ['sometimes', 'string', 'min:16', 'max:512', 'regex:/^[A-Za-z0-9:_.\-\[\]]+$/'],
            'title' => ['sometimes', 'string', 'max:120', 'not_regex:/[<>]/'],
            'body' => ['sometimes', 'string', 'max:255', 'not_regex:/[<>]/'],
            'level' => ['sometimes', 'string', Rule::in(['info', 'warning', 'critical'])],
        ]);

        $title = $data['title'] ?? '🚨 Alerta Push LifeSync';
        $body = $data['body'] ?? 'Prueba de notificación push enviada desde el endpoint de la API.';
        $level = $data['level'] ?? 'info';

        $usersQuery = User::query();
        if (! empty($data['email'])) {
            $usersQuery->where('email', $data['email']);
        } elseif (! empty($data['user_id'])) {
            $usersQuery->where('id', $data['user_id']);
        }

        $users = $usersQuery->latest('id')->limit(10)->get();
        $totals = ['sent' => 0, 'failed' => 0, 'skipped' => 0];

        foreach ($users as $user) {
            $s = $fcm->sendToUser($user, $title, $body, [
                'type' => 'api_test',
                'level' => $level,
            ]);
            $totals['sent'] += $s['sent'];
            $totals['failed'] += $s['failed'];
            $totals['skipped'] += $s['skipped'];
        }

        if (! empty($data['token'])) {
            $tempDevice = new DeviceToken(['token' => $data['token'], 'platform' => 'android']);
            $res = $fcm->sendToToken($tempDevice, $title, $body, ['type' => 'api_test', 'level' => $level]);
            $totals[$res]++;
        }

        $creds = $fcm->loadCredentials();

        return response()->json([
            'ok' => true,
            'message' => 'Push notification despachada desde la API.',
            'firebase' => [
                'configured' => $creds !== null,
                'project_id' => $creds['project_id'] ?? config('services.fcm.project_id', 'lifesync-mobile'),
                'service_account' => $creds['client_email'] ?? null,
            ],
            'users_notified' => $users->pluck('email'),
            'registered_devices' => DeviceToken::count(),
            'stats' => $totals,
            'payload' => [
                'title' => $title,
                'body' => $body,
                'level' => $level,
                'sent_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Devuelve las notificaciones push encoladas para el usuario autenticado.
     */
    public function poll(Request $request, FcmService $fcm): JsonResponse
    {
        return response()->json([
            'items' => $fcm->pullInbox($request->user()),
        ]);
    }
}
