<?php

namespace App\Http\Resources\Admin\Voucher;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class VoucherResource extends JsonResource
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
            'code'       => $this->code,
            'name'       => $this->name,
            'image'      => $this->image ? url(Storage::url($this->image)) : null,
            'type'       => $this->type,
            'discount'   => (float) $this->discount,
            'minmoney'   => (float) ($this->minmoney ?? 0),
            'status'     => $this->status ?? 'active',
            'enddate'    => $this->enddate,
            'createdate' => $this->createdate?->toDateTimeString(),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}