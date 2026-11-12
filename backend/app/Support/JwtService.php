<?php

namespace App\Support;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

/** Emite y valida tokens JWT firmados criptográficamente (HS256). */
class JwtService
{
    public function __construct(
        private readonly string $secret,
        private readonly int $ttl = 3600,
        private readonly string $issuer = 'lifesync-api',
    ) {
        if (strlen($secret) < 32) {
            throw new \InvalidArgumentException('JWT_SECRET debe tener al menos 32 caracteres.');
        }
    }

    public function issue(int $userId): array
    {
        $now = time();
        $token = JWT::encode([
            'iss' => $this->issuer,
            'sub' => (string) $userId,
            'iat' => $now,
            'exp' => $now + $this->ttl,
        ], $this->secret, 'HS256');

        return ['access_token' => $token, 'token_type' => 'Bearer', 'expires_in' => $this->ttl];
    }

    /** Devuelve el uid o null si el token es inválido/expirado/manipulado. */
    public function verify(string $token): ?int
    {
        try {
            $payload = JWT::decode($token, new Key($this->secret, 'HS256'));
            if (($payload->iss ?? null) !== $this->issuer || ! ctype_digit((string) ($payload->sub ?? ''))) {
                return null;
            }
            return (int) $payload->sub;
        } catch (Throwable) {
            return null;
        }
    }
}
