<?php

namespace App\Http\Resources\Admin\Product;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductResource extends JsonResource
{

    public function toArray(Request $request): array
    {
        return parent::toArray($request);
        return [
            'id'          => $this->id,
            'lang_id'     => $this->lang_id,
            'name'        => $this->name,
            'desc'        => $this->desc,
            'content'     => $this->content,
            'image'       => $this->image ? url(Storage::url($this->image)) : null,
            'attribute'   => $this->attribute,
            'url'         => $this->url,
            'author'      => $this->author,
            'seotitle'    => $this->seotitle,
            'seodesc'     => $this->seodesc,
            'params'      => $this->params ? json_decode($this->params, true) : null,
            'price'       => (float) ($this->price ?? 0),
            'saleprice'   => (float) ($this->saleprice ?? 0),
            'totalview'   => (int) ($this->totalview ?? 0),
            'order'       => (int) ($this->order ?? 0),
            'lastview'    => $this->lastview,
            'status'      => $this->status ?? 'active',

            'language'    => $this->whenLoaded('language'),
            'categories'  => $this->whenLoaded('categories'),
            'subProducts' => $this->whenLoaded('subProducts'),

            'created_at'  => $this->created_at?->toDateTimeString(),
            'updated_at'  => $this->updated_at?->toDateTimeString(),
        ];
    }
}