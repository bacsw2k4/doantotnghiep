<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AddShippingAddressRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\UploadAvatarRequest;
use App\Http\Resources\Auth\ShippingAddressResource;
use App\Http\Resources\Auth\UserAuthResource;
use App\Models\Order;
use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'role_id'   => $request->role_id,
            'firstname' => $request->firstname,
            'lastname'  => $request->lastname,
            'address'   => $request->address,
            'phone'     => $request->phone,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'status'    => 'active',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công',
            'user'    => new UserAuthResource($user->load('role')),
            'token'   => $token,
        ], 201);
    }
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Thông tin đăng nhập không chính xác',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'user'    => new UserAuthResource($user->load('role')),
            'token'   => $token,
        ], 200);
    }
    public function checkAuth()
    {
        return response()->json([
            'success' => true,
            'user' => new UserAuthResource(auth()->user()->load('role')),
        ]);
    }
    public function logout()
    {
        auth()->user()->currentAccessToken()->delete();
        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công',
        ]);
    }
    public function getProfile()
    {
        $user = auth()->user()->load('role');
        return response()->json([
            'success' => true,
            'user' => new UserAuthResource($user),
        ]);
    }
    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = auth()->user();
        $user->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin thành công',
            'user'    => new UserAuthResource($user->load(['role', 'orders'])),
        ]);
    }
    public function uploadAvatar(UploadAvatarRequest $request)
    {
        $user = auth()->user();
        if ($user->avatar && Storage::exists('public/' . $user->avatar)) {
            Storage::delete('public/' . $user->avatar);
        }
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật avatar thành công',
            'avatar_url' => asset('storage/' . $path),
        ]);
    }
    public function getShippingAddress()
    {
        $address = ShippingAddress::where('user_id', auth()->id())->first();
        return response()->json([
            'success' => true,
            'address' => new ShippingAddressResource($address)
        ]);
    }
    public function addShippingAddress(AddShippingAddressRequest $request)
    {
        //check địa chỉ mặc định,nếu địa chỉ đang chọn là mặc định,thì các địa chỉ khác cập nhaath là false
        if ($request->isDefault) {
            ShippingAddress::where('user_id', auth()->id())->update(['is_default' => false]);
        }
        $address = ShippingAddress::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'phone' => $request->phone,
            'address' => $request->address,
            'city' => $request->city,
            'country' => $request->country,
            'email' => $request->email,
            'desc' => $request->desc,
            'is_default' => $request->isDefault ?? false
        ]);
        return response()->json([
            'success' => true,
            'message' => 'Thêm địa chỉ thành công',
            'address' => new ShippingAddressResource($address)
        ]);
    }
    public function updateShippingAddress(AddShippingAddressRequest $request, $id)
    {
        $address = ShippingAddress::where('user_id', auth()->id())->findOrFail($id);
        if ($request->isDefault) {
            ShippingAddress::where('user_id', auth()->id())->update(['is_default' => false]);
        }
        $address->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật địa chỉ thành công',
            'address' => new ShippingAddressResource($address)
        ]);
    }
    public function deleteShippingAddress($id)
    {
        $address = ShippingAddress::where('user_id', auth()->id())->findOrFail($id);
        if ($address->is_default) {
            return response()->json(['success' => false, 'message' => 'Không thể xóa địa chỉ mặc định'], 403);
        }
        $address->delete();
        return response()->json([
            'success' => true,
            'message' => 'Xóa địa chỉ thành công',
        ]);
    }
    public function getOrders()
    {
        $orders = Order::with([
            'orderDetails.product', //load thong tin san pham
            'orderDetails.attributes.attribute' //load thong tin tu orderDetailAtribute
        ])
            ->where('author', auth()->id())
            ->orderBy('createdate', 'desc')
            ->get();
        return response()->json([
            'success' => true,
            'orders'  => $orders->map(function ($order) {
                $itemCount = $order->orderDetails->sum('volume'); //lay tong so luong san pham trong don hang
                $firstImage = $order->orderDetails->first()?->product?->image; //lay anh san pham dau tien lam anh dai dien cho don hang

                return [
                    'id'         => $order->id,
                    'orderCode'  => 'ORD-' . str_pad($order->id, 6, '0', STR_PAD_LEFT), //tao ma don hang tu id
                    'date'       => $order->createdate->format('d/m/Y'), //format lai ngay thang
                    'total'      => number_format($order->discount_total_price ?? $order->total_price, 0, ',', '.'), //format lai gia tien
                    'status'     => $order->status === 'active' ? 'processing' : $order->status, //doi trang thai active thanh processing de hien thi tren frontend
                    'items'      => $itemCount, //so luong san pham trong don hang
                    'image'      => $firstImage ? asset('storage/' . $firstImage) : null, //
                    'details'    => $order->orderDetails->map(function ($d) {
                        return [
                            'productId'   => $d->product_id,
                            'productName' => $d->product->name,
                            'price'       => number_format($d->price, 0, ',', '.'),
                            'volume'      => $d->volume,
                            'totalPrice'  => number_format($d->total_price, 0, ',', '.'),
                            'image'       => $d->product->image ? asset('storage/' . $d->product->image) : null,
                            'attributes'  => $d->attributes->map(function ($attr) {
                                return [
                                    'id'   => $attr->attribute->id ?? null,
                                    'name' => $attr->attribute->name ?? null,
                                ];
                            })->toArray(),
                        ];
                    })->toArray(),
                ];
            })
        ]);
    }
}
