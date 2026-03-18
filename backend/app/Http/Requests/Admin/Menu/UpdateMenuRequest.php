<?php

namespace App\Http\Requests\Admin\Menu;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMenuRequest extends FormRequest
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
        $menuId = $this->route('menu')?->id ?? $this->route('id');

        return [
            'lang_id'    => 'nullable|exists:languages,id',
            'parentid'   => 'nullable|exists:menus,id',
            'parentsid'  => 'nullable|string|max:255',
            'name'       => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('menus', 'name')->ignore($menuId),
            ],
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
    public function messages(): array
    {
        return [
            'name.unique' => 'Tên menu đã tồn tại.',
        ];
    }
}