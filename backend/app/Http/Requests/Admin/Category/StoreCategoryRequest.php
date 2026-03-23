<?php

namespace App\Http\Requests\Admin\Category;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{

    public function rules(): array
    {
        return [
            'lang_id'    => 'nullable|exists:languages,id',
            'name'       => 'required|string|max:255|unique:categories,name',
            'desc'       => 'nullable|string',
            'content'    => 'nullable|string',
            'seotitle'   => 'nullable|string|max:255',
            'seodesc'    => 'nullable|string',
            'url'        => 'nullable|string|max:255',
            'image'      => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'attribute'  => 'nullable|string',
            'order'      => 'nullable|integer',
            'status'     => 'nullable|in:active,inactive',
        ];
    }
}