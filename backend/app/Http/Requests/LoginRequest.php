<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'grant_type' => ['sometimes', 'in:password'],
            'email' => ['required_without:username', 'nullable', 'email', 'max:150'],
            'username' => ['required_without:email', 'nullable', 'email', 'max:150'],
            'password' => ['required', 'string', 'max:255'],
        ];
    }
}
