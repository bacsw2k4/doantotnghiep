<?php

namespace App\Http\Requests\Admin\Attribute;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttributeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'lang_id'  => 'required|exists:languages,id',
            'parentid' => 'nullable|exists:attributes,id',
            'name'     => 'required|string|max:255',
            'type'     => 'nullable|string|max:50',
            'color'    => 'nullable|string|max:50',
            'image'    => 'nullable',
            'order'    => 'nullable|integer',
            'status'   => 'nullable|in:active,inactive',
        ];
    }
}