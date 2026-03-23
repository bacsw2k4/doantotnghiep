<?php

namespace App\Http\Requests\Admin\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'lang_id'     => 'required|exists:languages,id',
            'name'        => 'required|string|max:255',
            'desc'        => 'nullable|string',
            'content'     => 'nullable|string',
            'image'       => 'nullable|image',
            'attribute'   => 'nullable|string',
            'url'         => 'nullable|string|max:255',
            'author'      => 'nullable|string|max:255',
            'seotitle'    => 'nullable|string|max:255',
            'seodesc'     => 'nullable|string',
            'params'      => 'nullable|json',
            'price'       => 'nullable|numeric|min:0',
            'saleprice'   => 'nullable|numeric|min:0',
            'totalview'   => 'nullable|integer|min:0',
            'order'       => 'nullable|integer',
            'lastview'    => 'nullable|date',
            'status'      => 'nullable|in:active,inactive',

            'categories'         => 'nullable|array',
            'categories.*'       => 'exists:categories,id',

            'sub_images'         => 'nullable|array',
            'sub_images.*'       => 'image',

            'sub_products'       => 'nullable|array',
            'sub_products.*.title'    => 'nullable|string|max:255',
            'sub_products.*.content'  => 'nullable|string',
            'sub_products.*.author'   => 'nullable|string|max:255',
            'sub_products.*.url'      => 'nullable|string|max:255',
            'sub_products.*.status'   => 'nullable|in:active,inactive',
        ];
    }
}