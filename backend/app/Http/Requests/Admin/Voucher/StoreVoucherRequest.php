<?php

namespace App\Http\Requests\Admin\Voucher;

use Illuminate\Foundation\Http\FormRequest;

class StoreVoucherRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code'      => 'required|string|max:50|unique:vouchers,code',
            'name'      => 'required|string|max:255',
            'image'     => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'type'      => 'required|in:percentage,fixed',
            'discount'  => 'required|numeric|min:0',
            'minmoney'  => 'nullable|numeric|min:0',
            'status'    => 'nullable|in:active,inactive',
            'enddate'   => 'nullable|date|after_or_equal:today',
        ];
    }
}