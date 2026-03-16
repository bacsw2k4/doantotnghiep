<?php

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserAuthResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'userId' => $this->id,
            'fullName' => $this->firstname . ' ' . $this->lastname,
            'email' => $this->email,
            'phone' => $this->phone ?? null,
            'address' => $this->address ?? null,
            'avatar' => $this->avatar ? asset('storage/' . $this->avatar) : null,
            'role' => [
                'id' => $this->role->id,
                'name' => $this->role->name,
            ],
            'status' => $this->status,
            'joinedAt' => $this->created_at->format('d/m/Y'),
            'totalOrders' => $this->whenLoaded('orders', fn() => $this->orders()->count()),
            'totalSpent'  => $this->whenLoaded('orders', fn() => number_format($this->orders()->sum('total_price'), 0, ',', '.')),

        ];
    }
}