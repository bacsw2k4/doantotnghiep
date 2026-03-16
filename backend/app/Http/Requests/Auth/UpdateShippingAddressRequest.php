<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShippingAddressRequest extends FormRequest
{

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'      => 'required|string|max:255',
            'fullName'  => 'required|string|max:255',
            'phone'     => 'required|string|max:20',
            'address'   => 'required|string|max:255',
            'city'      => 'nullable|string|max:255',
            'country'   => 'nullable|string|max:255',
            'email'     => 'nullable|email|max:255',
            'desc'      => 'nullable|string',
            'isDefault' => 'boolean',
        ];
    }
}