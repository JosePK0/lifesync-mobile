<?php

namespace App\Services\Export;

use Illuminate\Support\Collection;

class CsvExportStrategy implements ExportStrategy
{
    public function contentType(): string { return 'text/csv'; }
    public function extension(): string { return 'csv'; }

    public function export(Collection $records): string
    {
        $out = fopen('php://temp', 'r+');
        fputcsv($out, ['tipo', 'titulo', 'detalles', 'telefono', 'dosis', 'critico'], ',', '"', '\\');
        foreach ($records as $r) {
            fputcsv($out, array_map([$this, 'safe'], [
                $r->type, $r->title, $r->details, $r->phone, $r->dosage, $r->critical ? 'si' : 'no',
            ]), ',', '"', '\\');
        }
        rewind($out);
        return stream_get_contents($out);
    }

    /** Previene CSV/formula injection. */
    private function safe(?string $v): string
    {
        $v = (string) $v;
        return preg_match('/^[=+\-@\t\r]/', $v) ? "'".$v : $v;
    }
}
