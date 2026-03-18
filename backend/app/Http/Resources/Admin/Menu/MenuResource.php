<?php

namespace App\Http\Resources\Admin\Menu;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuResource extends JsonResource
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
            'parentsid'  => $this->parentsid,
            'name'       => $this->name,
            'desc'       => $this->desc,
            'content'    => $this->content,
            'seotitle'   => $this->seotitle,
            'seodesc'    => $this->seodesc,
            'url'        => $this->url,
            'params'     => $this->params,
            'order'      => (int) ($this->order ?? 0),
            'status'     => $this->status ?? 'active',
            'language'   => $this->whenLoaded('language'),
            'parent'     => $this->whenLoaded('parent'),
            'children'   => MenuResource::collection($this->whenLoaded('children')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}