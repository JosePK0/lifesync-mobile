<?php

namespace App\Services\Export;

use Illuminate\Support\Collection;

class JsonExportStrategy implements ExportStrategy
{
    public function contentType(): string { return 'application/json'; }
    public function extension(): string { return 'json'; }

    public function export(Collection $records): string
    {
        return json_encode([
            'standard' => 'LifeSync-Emergency-v1',
            'generated_at' => now()->toIso8601String(),
            'records' => $records->map(fn ($r) => [
                'type' => $r->type, 'title' => $r->title, 'details' => $r->details,
                'phone' => $r->phone, 'dosage' => $r->dosage, 'critical' => (bool) $r->critical,
            ])->values(),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
