<?php

namespace App\Http\Resources\Admin\Footer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FooterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lang_id' => $this->lang_id,
            'company' => $this->company ?? [],
            'support' => $this->support ?? [],
            'categories' => $this->categories ?? [],
            'legal' => $this->legal ?? [],
            'features' => $this->features ?? [],
            'company_description' => $this->company_description,
            'contact_address' => $this->contact_address,
            'contact_phone' => $this->contact_phone,
            'contact_email' => $this->contact_email,
            'social_facebook' => $this->social_facebook,
            'social_instagram' => $this->social_instagram,
            'social_twitter' => $this->social_twitter,
            'social_youtube' => $this->social_youtube,
            'bottom_copyright' => $this->bottom_copyright,
            'badges' => $this->badges ?? [],
            'payment_methods' => array_map(function ($method) {
                return [
                    'name' => $method['name'],
                    'logo' => $method['logo'] ? asset($method['logo']) : null,
                ];
            }, $this->payment_methods ?? []),
            'status' => $this->status,
            'order' => $this->order,
        ];
    }
}
