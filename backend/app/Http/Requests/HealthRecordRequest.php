<?php

namespace App\Http\Requests;

use App\Models\HealthRecord;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validación de esquema en servidor: tipos estrictos y listas blancas.
 * Bloquea payloads corruptos/inyección (además de Eloquent parametrizado).
 */
class HealthRecordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $req = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'type' => [$req, 'string', Rule::in(HealthRecord::TYPES)],
            'title' => [$req, 'string', 'min:1', 'max:150', 'regex:/^[^<>{}$;`]+$/u'],
            'details' => ['nullable', 'string', 'max:2000'],
            'phone' => ['nullable', 'string', 'regex:/^\+?[0-9 ()\-]{7,20}$/'],
            'dosage' => ['nullable', 'string', 'max:100'],
            'remind_at' => ['nullable', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'critical' => ['sometimes', 'boolean'],
        ];
    }

    public function validated($key = null, $default = null)
    {
        // user_id jamás se acepta del cliente (evita mass-assignment/IDOR)
        return collect(parent::validated($key, $default))->except('user_id')->all();
    }
}
