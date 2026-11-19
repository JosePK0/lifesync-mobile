<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\JwtService;
use Closure;
use Illuminate\Http\Request;

class JwtAuthenticate
{
    public function __construct(private readonly JwtService $jwt) {}

    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        $uid = $token ? $this->jwt->verify($token) : null;
        $user = $uid ? User::find($uid) : null;

        if (! $user) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $request->setUserResolver(fn () => $user);
        $request->attributes->set('auth_uid', $user->id);
        auth()->setUser($user);

        return $next($request);
    }
}
