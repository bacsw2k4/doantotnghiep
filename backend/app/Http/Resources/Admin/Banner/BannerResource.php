<?php

namespace App\Http\Resources\Admin\Banner;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BannerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'lang_id'     => $this->lang_id,
            'title'       => $this->title,
            'subtitle'    => $this->subtitle,
            'description' => $this->description,
            'image'       => $this->image,
            'cta_text'    => $this->cta_text,
            'cta_link'    => $this->cta_link,
            'badge'       => $this->badge,
            'theme'       => $this->theme ?? 'light',
            'order'       => (int) ($this->order ?? 0),
            'status'      => $this->status ?? 'active',
            'language'    => $this->whenLoaded('language'),
            'created_at'  => $this->created_at?->toDateTimeString(),
            'updated_at'  => $this->updated_at?->toDateTimeString(),

        ];
    }
}
