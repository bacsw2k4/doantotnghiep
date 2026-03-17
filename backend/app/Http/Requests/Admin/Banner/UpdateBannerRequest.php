<?php

namespace App\Http\Requests\Admin\Banner;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBannerRequest extends FormRequest
{

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'lang_id'     => 'nullable|exists:languages,id',
            'title'       => 'sometimes|required|string|max:255',
            'subtitle'    => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'cta_text'    => 'nullable|string|max:255',
            'cta_link'    => 'nullable|string|max:255',
            'badge'       => 'nullable|string|max:255',
            'theme'       => 'in:light,dark',
            'order'       => 'nullable|integer',
            'status'      => 'nullable|in:active,inactive',
        ];
    }
}
