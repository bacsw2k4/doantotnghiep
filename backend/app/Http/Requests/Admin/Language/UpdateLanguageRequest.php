<?php

namespace App\Http\Requests\Admin\Language;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLanguageRequest extends FormRequest
{

    public function rules(): array
    {
        $language = $this->route('language');
        return [
            'name'   => 'sometimes|required|string|max:255|unique:languages,name,' . $language->id,
            'desc'   => 'nullable|string',
            'image'  => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'order'  => 'nullable|integer',
            'status' => 'nullable|in:active,inactive',
        ];
    }
}