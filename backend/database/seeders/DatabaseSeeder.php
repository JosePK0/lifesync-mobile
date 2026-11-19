<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $u = User::updateOrCreate(['email' => 'demo@lifesync.test'], ['name' => 'Ana Demo', 'password' => 'Demo12345']);
        $u->healthRecords()->delete();
        $u->healthRecords()->createMany([
            ['type' => 'blood_type', 'title' => 'O+'],
            ['type' => 'allergy', 'title' => 'Penicilina', 'details' => 'Reacción severa', 'critical' => true],
            ['type' => 'medication', 'title' => 'Metformina', 'dosage' => '850 mg cada 12 h', 'remind_at' => '08:00', 'critical' => true],
            ['type' => 'contact', 'title' => 'María (mamá)', 'phone' => '+52 999 123 4567'],
        ]);
    }
}
