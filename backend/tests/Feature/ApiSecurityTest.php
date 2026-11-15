<?php

namespace Tests\Feature;

use App\Models\HealthRecord;
use App\Models\User;
use App\Support\DatabaseConnection;
use App\Support\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ApiSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function auth(User $u): array
    {
        return ['Authorization' => 'Bearer '.app(JwtService::class)->issue($u->id)['access_token']];
    }

    public function test_register_hashes_password_and_login_returns_jwt(): void
    {
        $res = $this->postJson('/api/auth/register', ['name' => 'Ana', 'email' => 'ana@test.com', 'password' => 'Secreta123']);
        $res->assertCreated()->assertJsonStructure(['access_token', 'token_type', 'user']);

        $stored = DB::table('users')->where('email', 'ana@test.com')->value('password');
        $this->assertNotSame('Secreta123', $stored);
        $this->assertTrue(password_verify('Secreta123', $stored));

        $this->postJson('/api/oauth/token', ['grant_type' => 'password', 'username' => 'ana@test.com', 'password' => 'Secreta123'])
            ->assertOk()->assertJsonStructure(['access_token']);
        $this->postJson('/api/oauth/token', ['email' => 'ana@test.com', 'password' => 'mala'])->assertStatus(401);
    }

    public function test_weak_password_rejected(): void
    {
        $this->postJson('/api/auth/register', ['name' => 'Ana', 'email' => 'a@t.com', 'password' => '123'])
            ->assertStatus(422);
    }

    public function test_records_require_token(): void
    {
        $this->getJson('/api/records')->assertStatus(401);
        $this->getJson('/api/records', ['Authorization' => 'Bearer falso'])->assertStatus(401);
    }

    public function test_crud_for_owner(): void
    {
        $u = User::factory()->create();
        $h = $this->auth($u);
        $id = $this->postJson('/api/records', ['type' => 'allergy', 'title' => 'Penicilina', 'critical' => true], $h)
            ->assertCreated()->json('id');
        $this->putJson("/api/records/$id", ['title' => 'Aspirina'], $h)->assertOk()->assertJsonPath('title', 'Aspirina');
        $this->getJson('/api/records', $h)->assertOk()->assertJsonCount(1);
        $this->deleteJson("/api/records/$id", [], $h)->assertNoContent();
    }

    public function test_idor_is_blocked(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $rec = $owner->healthRecords()->create(['type' => 'blood_type', 'title' => 'O+']);
        $h = $this->auth($attacker);

        $this->getJson("/api/records/{$rec->id}", $h)->assertForbidden();
        $this->putJson("/api/records/{$rec->id}", ['title' => 'hack'], $h)->assertForbidden();
        $this->deleteJson("/api/records/{$rec->id}", [], $h)->assertForbidden();
        $this->getJson('/api/records', $h)->assertJsonCount(0);
        $this->assertSame('O+', $rec->fresh()->title);
    }

    public function test_user_id_cannot_be_forged(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $id = $this->postJson('/api/records', ['type' => 'allergy', 'title' => 'X', 'user_id' => $b->id], $this->auth($a))->json('id');
        $this->assertSame($a->id, HealthRecord::find($id)->user_id);
    }

    public function test_malicious_payloads_rejected(): void
    {
        $h = $this->auth(User::factory()->create());
        $this->postJson('/api/records', ['type' => 'allergy; DROP TABLE users', 'title' => 'x'], $h)->assertStatus(422);
        $this->postJson('/api/records', ['type' => 'allergy', 'title' => '<script>alert(1)</script>'], $h)->assertStatus(422);
        $this->postJson('/api/records', ['type' => 'allergy', 'title' => ['$ne' => 1]], $h)->assertStatus(422);
        $this->postJson('/api/records', ['type' => 'contact', 'title' => 'Mamá', 'phone' => "1' OR '1'='1"], $h)->assertStatus(422);
        $this->postJson('/api/records', ['type' => 'medication', 'title' => 'x', 'remind_at' => '99:99'], $h)->assertStatus(422);
    }

    public function test_export_formats(): void
    {
        $u = User::factory()->create();
        $u->healthRecords()->create(['type' => 'allergy', 'title' => 'Polen']);
        $h = $this->auth($u);
        $this->get('/api/records/export?format=csv', $h)->assertOk()->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->getJson('/api/records/export?format=json', $h)->assertOk();
        $this->getJson('/api/records/export?format=xml', $h)->assertStatus(422);
    }

    public function test_database_connection_is_singleton(): void
    {
        $this->assertSame(app(DatabaseConnection::class), app(DatabaseConnection::class));
    }

    public function test_incident_tracking(): void
    {
        $h = $this->auth(User::factory()->create());
        $this->postJson('/api/incidents', ['latitude' => 20.97, 'longitude' => -89.62], $h)->assertCreated();
        $this->postJson('/api/incidents', ['latitude' => 999, 'longitude' => 0], $h)->assertStatus(422);
        $this->getJson('/api/incidents')->assertStatus(401);
    }

    public function test_push_device_token_registration_and_fcm_dispatch(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-google-oauth-token'], 200),
            'https://fcm.googleapis.com/v1/projects/*/messages:send' => Http::response(['name' => 'projects/lifesync-mobile/messages/1'], 200),
        ]);

        $user = User::factory()->create();
        $h = $this->auth($user);
        $validToken = 'fcm_token_android_1234567890abcdef';

        // Rechaza tokens cortos o con caracteres maliciosos
        $this->postJson('/api/devices/token', ['token' => 'short'], $h)->assertStatus(422);
        $this->postJson('/api/devices/token', ['token' => '<script>alert(1)</script>1234567890'], $h)->assertStatus(422);

        // Registra token válido
        $this->postJson('/api/devices/token', ['token' => $validToken, 'platform' => 'android'], $h)
            ->assertCreated()
            ->assertJsonPath('platform', 'android');

        // Envía notificación de prueba vía FCM
        $res = $this->postJson('/api/notifications/test', [], $h)->assertOk();
        $this->assertSame(1, $res->json('stats.sent'));

        // Desregistra token al cerrar sesión
        $this->deleteJson('/api/devices/token', ['token' => $validToken], $h)->assertNoContent();
        $this->assertDatabaseMissing('device_tokens', ['token' => $validToken]);
    }
}
