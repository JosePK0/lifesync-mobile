<?php

namespace Tests\Unit;

use App\Support\JwtService;
use PHPUnit\Framework\TestCase;

class JwtServiceTest extends TestCase
{
    private string $secret = 'unit-test-secret-unit-test-secret-1234';

    public function test_issues_and_verifies_token(): void
    {
        $jwt = new JwtService($this->secret);
        $token = $jwt->issue(42)['access_token'];
        $this->assertSame(42, $jwt->verify($token));
    }

    public function test_rejects_tampered_token(): void
    {
        $jwt = new JwtService($this->secret);
        $token = $jwt->issue(1)['access_token'];
        $this->assertNull($jwt->verify($token.'x'));
        $this->assertNull($jwt->verify('basura'));
    }

    public function test_rejects_token_signed_with_other_secret(): void
    {
        $other = new JwtService(str_repeat('z', 40));
        $this->assertNull((new JwtService($this->secret))->verify($other->issue(1)['access_token']));
    }

    public function test_rejects_expired_token(): void
    {
        $jwt = new JwtService($this->secret, -10);
        $this->assertNull($jwt->verify($jwt->issue(1)['access_token']));
    }

    public function test_short_secret_is_refused(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new JwtService('corto');
    }
}
