<?php

namespace App\Http\Requests\Admin\Menu;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuRequest extends FormRequest
{


    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'lang_id'    => 'nullable|exists:languages,id',
            'parentid'   => 'nullable|exists:menus,id',
            'parentsid'  => 'nullable|string|max:255',
            'name'       => 'required|string|max:255|unique:menus,name',
            'desc'       => 'nullable|string',
            'content'    => 'nullable|string',
            'seotitle'   => 'nullable|string|max:255',
            'seodesc'    => 'nullable|string',
            'url'        => 'nullable|string|max:255',
            'params'     => 'nullable|string',
            'order'      => 'nullable|integer',
            'status'     => 'nullable|in:active,inactive',
        ];
    }
}