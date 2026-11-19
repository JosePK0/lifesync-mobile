<?php

namespace App\Support;

use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\DatabaseManager;

/**
 * Patrón SINGLETON: una única instancia compartida (registrada con
 * $this->app->singleton en AppServiceProvider) que centraliza el acceso a
 * la conexión de base de datos de toda la API.
 */
class DatabaseConnection
{
    private ?ConnectionInterface $connection = null;
    private static int $instances = 0;

    public function __construct(private readonly DatabaseManager $manager)
    {
        self::$instances++;
    }

    public function connection(): ConnectionInterface
    {
        return $this->connection ??= $this->manager->connection();
    }

    public static function instancesCreated(): int
    {
        return self::$instances;
    }
}
