<?php

namespace App\Http\Requests\Admin\PromotionSubscriber;

use Illuminate\Foundation\Http\FormRequest;

class SendEmailRequest extends FormRequest
{

    public function rules(): array
    {
        return [
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
            'ids' => 'nullable|array',
            'ids.*' => 'exists:promotion_subscribers,id',
        ];
    }
    public function messages()
    {
        return [
            'subject.required' => 'Tiêu đề email là bắt buộc',
            'content.required' => 'Nội dung email là bắt buộc',
        ];
    }
}