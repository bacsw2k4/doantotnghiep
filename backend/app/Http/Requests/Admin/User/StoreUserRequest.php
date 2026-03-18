<?php

namespace App\Http\Requests\Admin\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{

    public function rules(): array
    {
        return [
            'role_id'   => 'required|exists:roles,id',
            'firstname' => 'required|string|max:255',
            'lastname'  => 'required|string|max:255',
            'address'   => 'required|string',
            'phone'     => 'required|string|unique:users,phone',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:6',
            'status'    => 'nullable|in:active,inactive',
            'avatar'    => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];
    }
}
