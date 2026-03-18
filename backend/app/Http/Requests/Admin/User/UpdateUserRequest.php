<?php

namespace App\Http\Requests\Admin\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'role_id'   => 'sometimes|exists:roles,id',
            'firstname' => 'sometimes|required|string|max:255',
            'lastname'  => 'sometimes|required|string|max:255',
            'address'   => 'nullable|string',
            'phone'     => 'sometimes|required|string|unique:users,phone,' . $userId,
            'email'     => 'sometimes|required|email|unique:users,email,' . $userId,
            'password'  => 'nullable|string|min:6',
            'status'    => 'nullable|in:active,inactive',
            'avatar'    => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];
    }
}
