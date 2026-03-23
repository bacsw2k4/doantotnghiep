<?php

namespace App\Http\Resources\Admin\Attribute;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttributeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'lang_id'    => $this->lang_id,
            'parentid'   => $this->parentid,
            'name'       => $this->name,
            'type'       => $this->type,
            'color'      => $this->color,
            'image'      => $this->image ? url($this->image) : null,
            'order'      => $this->order ?? 0,
            'status'     => $this->status ?? 'active',
            'language'   => $this->whenLoaded('language'),
            'parent'     => $this->whenLoaded('parent'),
            'children'   => $this->whenLoaded('children'),
            'created_at' => $this->created_at ? \Carbon\Carbon::parse($this->created_at)->format('Y-m-d H:i:s') : null,
            'updated_at' => $this->updated_at ? \Carbon\Carbon::parse($this->updated_at)->format('Y-m-d H:i:s') : null,
        ];
    }
}