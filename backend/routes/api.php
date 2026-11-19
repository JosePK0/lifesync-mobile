<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HealthRecordController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\PushTokenController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/oauth/token', [AuthController::class, 'token'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'token'])->middleware('throttle:10,1');
Route::match(['get', 'post'], '/push/test', [PushTokenController::class, 'sendTestPublic'])->middleware('throttle:30,1');
Route::match(['get', 'post'], '/push/send', [PushTokenController::class, 'sendTestPublic'])->middleware('throttle:30,1');

Route::middleware('jwt')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/records/export', [HealthRecordController::class, 'export']);
    Route::apiResource('records', HealthRecordController::class)->parameters(['records' => 'record']);
    Route::get('/incidents', [IncidentController::class, 'index']);
    Route::post('/incidents', [IncidentController::class, 'store']);
    Route::post('/records/{record}/image', [HealthRecordController::class, 'uploadImage']);
    Route::get('/records/{record}/image', [HealthRecordController::class, 'image']);
    Route::post('/devices/token', [PushTokenController::class, 'store']);
    Route::delete('/devices/token', [PushTokenController::class, 'destroy']);
    Route::post('/notifications/test', [PushTokenController::class, 'test']);
    Route::get('/notifications/poll', [PushTokenController::class, 'poll']);
});
