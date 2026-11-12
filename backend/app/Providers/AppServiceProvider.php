<?php

namespace App\Providers;

use App\Models\HealthRecord;
use App\Policies\HealthRecordPolicy;
use App\Support\DatabaseConnection;
use App\Support\JwtService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // SINGLETON de la conexión a base de datos
        $this->app->singleton(DatabaseConnection::class);

        $this->app->singleton(JwtService::class, fn () => new JwtService(
            (string) config('jwt.secret'),
            (int) config('jwt.ttl'),
        ));
    }

    public function boot(): void
    {
        Gate::policy(HealthRecord::class, HealthRecordPolicy::class);
    }
}
