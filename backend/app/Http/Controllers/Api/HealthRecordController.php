<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\HealthRecordRequest;
use App\Models\HealthRecord;
use App\Services\Export\ExportService;
use App\Services\Push\FcmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class HealthRecordController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = $request->user()->healthRecords()->latest('id');
        if ($request->filled('type') && in_array($request->query('type'), HealthRecord::TYPES, true)) {
            $q->where('type', $request->query('type'));
        }

        return response()->json($q->get());
    }

    public function store(HealthRecordRequest $request, FcmService $fcm): JsonResponse
    {
        $record = $request->user()->healthRecords()->create($request->validated());

        if ($record->critical) {
            $fcm->sendToUser(
                $request->user(),
                '⚠️ Registro médico crítico añadido',
                "{$record->title}".($record->dosage ? " — {$record->dosage}" : ''),
                [
                    'type' => 'critical_record',
                    'level' => 'critical',
                    'record_id' => (string) $record->id,
                ]
            );
        }

        return response()->json($record, 201);
    }

    public function show(Request $request, HealthRecord $record): JsonResponse
    {
        Gate::authorize('manage', $record);

        return response()->json($record);
    }

    public function update(HealthRecordRequest $request, HealthRecord $record): JsonResponse
    {
        Gate::authorize('manage', $record);
        $record->update($request->validated());

        return response()->json($record);
    }

    public function destroy(HealthRecord $record): JsonResponse
    {
        Gate::authorize('manage', $record);
        if ($record->image_path) {
            Storage::disk('local')->delete($record->image_path);
        }
        $record->delete();

        return response()->json(null, 204);
    }

    public function uploadImage(Request $request, HealthRecord $record): JsonResponse
    {
        Gate::authorize('manage', $record);
        $request->validate(['image' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:4096']]);
        $path = $request->file('image')->store("prescriptions/{$record->user_id}", 'local');
        $record->update(['image_path' => $path]);

        return response()->json($record);
    }

    public function image(HealthRecord $record)
    {
        Gate::authorize('manage', $record);
        abort_unless($record->image_path && Storage::disk('local')->exists($record->image_path), 404);

        return Storage::disk('local')->response($record->image_path);
    }

    public function export(Request $request, ExportService $exports)
    {
        try {
            $strategy = $exports->for((string) $request->query('format', 'json'));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
        $records = $request->user()->healthRecords()->orderBy('type')->get();

        return response($strategy->export($records), 200, [
            'Content-Type' => $strategy->contentType(),
            'Content-Disposition' => 'attachment; filename="lifesync-historial.'.$strategy->extension().'"',
        ]);
    }
}
