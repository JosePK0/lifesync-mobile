<?php

namespace App\Services\Export;

use InvalidArgumentException;

/** Contexto del patrón Strategy: elige la estrategia bajo demanda. */
class ExportService
{
    /** @var array<string, ExportStrategy> */
    private array $strategies;

    public function __construct()
    {
        $this->strategies = [
            'json' => new JsonExportStrategy(),
            'csv' => new CsvExportStrategy(),
        ];
    }

    public function for(string $format): ExportStrategy
    {
        return $this->strategies[strtolower($format)]
            ?? throw new InvalidArgumentException("Formato no soportado: {$format}");
    }
}
