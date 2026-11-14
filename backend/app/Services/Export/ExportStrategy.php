<?php

namespace App\Services\Export;

use Illuminate\Support\Collection;

/** Patrón STRATEGY: cada formato de exportación implementa esta interfaz. */
interface ExportStrategy
{
    public function contentType(): string;
    public function extension(): string;
    public function export(Collection $records): string;
}
