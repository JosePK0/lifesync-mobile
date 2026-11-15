<?php

namespace Tests\Unit;

use App\Models\HealthRecord;
use App\Services\Export\CsvExportStrategy;
use App\Services\Export\ExportService;
use App\Services\Export\JsonExportStrategy;
use PHPUnit\Framework\TestCase;

class ExportStrategyTest extends TestCase
{
    private function records()
    {
        return collect([new HealthRecord(['type' => 'allergy', 'title' => '=cmd|calc', 'details' => 'Penicilina', 'critical' => true])]);
    }

    public function test_json_strategy(): void
    {
        $out = json_decode((new JsonExportStrategy)->export($this->records()), true);
        $this->assertSame('allergy', $out['records'][0]['type']);
    }

    public function test_csv_strategy_prevents_formula_injection(): void
    {
        $csv = (new CsvExportStrategy)->export($this->records());
        $this->assertStringContainsString("'=cmd|calc", $csv);
    }

    public function test_service_selects_strategy_and_rejects_unknown(): void
    {
        $svc = new ExportService;
        $this->assertInstanceOf(CsvExportStrategy::class, $svc->for('csv'));
        $this->expectException(\InvalidArgumentException::class);
        $svc->for('xml');
    }
}
