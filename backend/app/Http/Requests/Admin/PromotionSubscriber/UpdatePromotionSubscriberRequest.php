<?php

namespace App\Http\Requests\Admin\PromotionSubscriber;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePromotionSubscriberRequest extends FormRequest
{

    public function rules(): array
    {
        return [
            'email' => 'sometimes|required|email|max:255|unique:promotion_subscribers,email,' . $this->promotionSubscriber->id,
            'status' => 'nullable|in:active,inactive',
        ];
    }
    public function messages(): array
    {
        return [
            'email.required' => 'Email là bắt buộc',
            'email.email' => 'Email không hợp lệ',
            'email.max' => 'Email không được vượt quá 255 ký tự',
            'email.unique' => 'Email đã tồn tại trong hệ thống',
            'status.in' => 'Trạng thái không hợp lệ',
        ];
    }
}