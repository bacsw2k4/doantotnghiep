<?php

namespace App\Http\Resources\Admin\Category;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{

    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'lang_id'    => $this->lang_id,
            'name'       => $this->name,
            'desc'       => $this->desc,
            'content'    => $this->content,
            'seotitle'   => $this->seotitle,
            'seodesc'    => $this->seodesc,
            'url'        => $this->url,
            'image'      => $this->image,
            'attribute'  => $this->attribute,
            'order'      => (int) ($this->order ?? 0),
            'status'     => $this->status ?? 'active',
            'language'   => $this->whenLoaded('language'),
            'parent'     => $this->whenLoaded('parent'),
            'children'   => CategoryResource::collection($this->whenLoaded('children')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}