<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Support\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(private readonly JwtService $jwt) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated()); // cast 'hashed' => bcrypt

        return response()->json($this->payload($user), 201);
    }

    /** Endpoint estilo OAuth 2.0 (grant_type=password) que devuelve JWT firmado. */
    public function token(LoginRequest $request): JsonResponse
    {
        $email = $request->input('email', $request->input('username'));
        $user = User::where('email', $email)->first();

        // Hash::check siempre se ejecuta para evitar timing/enumeración de usuarios
        $hash = $user?->password ?? '$2y$12$usesomesillystringforsaltuseless.abcdefghijklmnopqrstuv';
        if (! Hash::check($request->input('password'), $hash) || ! $user) {
            return response()->json([
                'error' => 'invalid_grant',
                'message' => 'Credenciales inválidas.',
            ], 401);
        }

        return response()->json($this->payload($user));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->only(['id', 'name', 'email']));
    }

    private function payload(User $user): array
    {
        return $this->jwt->issue($user->id) + ['user' => $user->only(['id', 'name', 'email'])];
    }
}
