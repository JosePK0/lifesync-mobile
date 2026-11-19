<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Push\FcmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Rastreo en la nube de incidentes (geolocalización del SOS). */
class IncidentController extends Controller
{
    public function store(Request $request, FcmService $fcm): JsonResponse
    {
        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $incident = $request->user()->incidents()->create($data);

        $fcm->sendToUser(
            $request->user(),
            '🚨 Alerta SOS registrada',
            sprintf('Ubicación de emergencia registrada (%.5f, %.5f).', $incident->latitude, $incident->longitude),
            [
                'type' => 'sos',
                'level' => 'critical',
                'incident_id' => (string) $incident->id,
            ]
        );

        return response()->json($incident, 201);
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($request->user()->incidents()->latest()->limit(20)->get());
    }
}
