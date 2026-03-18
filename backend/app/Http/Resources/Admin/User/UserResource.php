<?php

namespace App\Http\Resources\Admin\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'role_id'    => $this->role_id,
            'firstname'  => $this->firstname,
            'lastname'   => $this->lastname,
            'fullname'   => $this->firstname . ' ' . $this->lastname,
            'address'    => $this->address,
            'phone'      => $this->phone,
            'email'      => $this->email,
            'avatar'     => $this->avatar ? url($this->avatar) : null,
            'status'     => $this->status ?? 'active',
            'role'       => $this->whenLoaded('role'),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
