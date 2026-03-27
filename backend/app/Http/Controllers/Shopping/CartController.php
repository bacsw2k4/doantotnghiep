<?php

namespace App\Http\Controllers\Shopping;

use App\Http\Controllers\Controller;
use App\Models\Attribute as ModelsAttribute;
use App\Models\Cart;
use App\Models\CartDetail;
use App\Models\CartDetailAttribute;
use App\Models\Log;
use App\Models\Product;
use App\Models\Attribute;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    public function index(Request $request)
    {
        try {
            $sessionId = $request->session()->getId();
            $user = Auth::user();
            $langId = $request->query('lang_id', 1);

            $cart = Cart::where(function ($query) use ($user, $sessionId) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
                ->where('status', 'pending')
                ->first();

            if (!$cart) {
                return response()->json([
                    'data' => [],
                    'total_items' => 0,
                    'total_price' => 0,
                    'message' => 'Giỏ hàng trống.',
                ], 200);
            }

            $cartDetails = CartDetail::with(['product', 'attributes'])
                ->where('cart_id', $cart->id)
                ->whereHas('product', function ($query) use ($langId) {
                    $query->where('lang_id', $langId)->where('status', 'active');
                })
                ->get();

            $totalItems = $cartDetails->sum('quantity');
            $totalPrice = $cartDetails->sum('total_price');
            $cartItems = $cartDetails->map(function ($detail) {
                $variant = $detail->attributes->map(function ($attr) {
                    return $attr->name . ($attr->color ? ' - ' . $attr->color : '');
                })->implode(', ');

                return [
                    'id' => (string) $detail->id,
                    'name' => $detail->product->name,
                    'originalPrice' => $detail->product->price,
                    'price' => $detail->price,
                    'quantity' => $detail->quantity,
                    'image' => $detail->product->image ? asset('storage/' . $detail->product->image) : '/placeholder.svg',
                    'variant' => $variant ?: null,
                    'product_id' => $detail->product_id,
                ];
            });

            return response()->json([
                'data' => $cartItems,
                'total_items' => $totalItems,
                'total_price' => $totalPrice,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Không thể tải giỏ hàng: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'lang_id' => 'required|exists:languages,id',
            'attribute_ids' => 'nullable|array',
            'attribute_ids.*' => 'exists:attributes,id',
        ]);

        try {
            $sessionId = $request->session()->getId();
            $user = Auth::user();
            $product = Product::where('id', $request->product_id)
                ->where('lang_id', $request->lang_id)
                ->where('status', 'active')
                ->firstOrFail();

            $cart = Cart::where(function ($query) use ($user, $sessionId) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
                ->where('status', 'pending')
                ->first();

            if (!$cart) {
                $cart = Cart::create([
                    'user_id' => $user ? $user->id : null,
                    'session_id' => $user ? null : $sessionId,
                    'total_price' => 0,
                    'total_quantity' => 0,
                    'status' => 'pending',
                ]);
            }

            // Lấy attribute_ids: nếu không có hoặc mảng rỗng thì lấy attribute đầu tiên của sản phẩm
            $attributeIds = $request->attribute_ids;

            if ($attributeIds === null || (is_array($attributeIds) && empty($attributeIds))) {
                // Lấy attribute đầu tiên của sản phẩm
                $attributesData = json_decode($product->attribute, true);
                $parentAttributeIds = $attributesData['attribute_ids'] ?? [];

                Log::info('Product attribute data', [
                    'product_id' => $product->id,
                    'attribute_field' => $product->attribute,
                    'decoded_data' => $attributesData,
                    'parent_ids' => $parentAttributeIds
                ]);

                $attributeIds = []; // Khởi tạo lại mảng

                if (!empty($parentAttributeIds)) {
                    // Lấy attribute con đầu tiên của mỗi attribute cha
                    foreach ($parentAttributeIds as $parentId) {
                        $firstChild = Attribute::where('lang_id', $request->lang_id)
                            ->where('parentid', $parentId)
                            ->where('status', 'active')
                            ->orderBy('order', 'asc')
                            ->first();

                        if ($firstChild) {
                            $attributeIds[] = $firstChild->id;
                        }
                    }
                }

                Log::info('Auto-selected attribute IDs for product ' . $product->id, [
                    'parent_ids' => $parentAttributeIds,
                    'selected_ids' => $attributeIds
                ]);
            }

            Log::info('Final attribute IDs for cart', [
                'product_id' => $product->id,
                'attribute_ids' => $attributeIds
            ]);

            $existingDetail = null;

            if ($attributeIds && count($attributeIds) > 0) {
                $attributeCount = count($attributeIds);

                $existingDetail = CartDetail::where('cart_id', $cart->id)
                    ->where('product_id', $product->id)
                    ->whereHas('attributes', function ($q) use ($attributeIds, $attributeCount) {
                        $q->whereIn('attribute_id', $attributeIds)
                            ->select(DB::raw('cart_detail_id'))
                            ->groupBy('cart_detail_id')
                            ->havingRaw('COUNT(DISTINCT attribute_id) = ?', [$attributeCount]);
                    }, '>=', $attributeCount)
                    ->first();
            } else {
                // Trường hợp sản phẩm không có attribute nào
                $existingDetail = CartDetail::where('cart_id', $cart->id)
                    ->where('product_id', $product->id)
                    ->whereDoesntHave('attributes')
                    ->first();
            }

            DB::beginTransaction();

            if ($existingDetail) {
                $existingDetail->quantity += $request->quantity;
                $existingDetail->total_price = $existingDetail->price * $existingDetail->quantity;
                $existingDetail->save();

                Log::info('Updated existing cart detail', [
                    'cart_detail_id' => $existingDetail->id,
                    'new_quantity' => $existingDetail->quantity
                ]);
            } else {
                $price = $product->saleprice ?? 0;
                Log::info('Base price for product', ['price' => $price]);

                if ($attributeIds && count($attributeIds) > 0) {
                    $attributes = ModelsAttribute::whereIn('id', $attributeIds)
                        ->where('lang_id', $request->lang_id)
                        ->where('status', 'active')
                        ->get();

                    $additionalPrice = $attributes->sum(function ($attr) {
                        $params = $attr->params ? json_decode($attr->params, true) : [];
                        return $params['price'] ?? 0;
                    });

                    $price += $additionalPrice;

                    Log::info('Attribute price calculation', [
                        'base_price' => $product->saleprice,
                        'additional_price' => $additionalPrice,
                        'final_price' => $price
                    ]);
                }

                $cartDetail = CartDetail::create([
                    'cart_id' => $cart->id,
                    'product_id' => $product->id,
                    'quantity' => $request->quantity,
                    'price' => $price,
                    'total_price' => $price * $request->quantity,
                ]);

                Log::info('Created new cart detail', [
                    'cart_detail_id' => $cartDetail->id,
                    'product_id' => $product->id,
                    'price' => $price
                ]);

                if ($attributeIds && count($attributeIds) > 0) {
                    foreach ($attributeIds as $attributeId) {
                        CartDetailAttribute::create([
                            'cart_detail_id' => $cartDetail->id,
                            'attribute_id' => $attributeId,
                        ]);
                    }

                    Log::info('Added attributes to cart detail', [
                        'cart_detail_id' => $cartDetail->id,
                        'attribute_ids' => $attributeIds
                    ]);
                }
            }

            $cart->total_quantity = $cart->cartDetails()->sum('quantity');
            $cart->total_price = $cart->cartDetails()->sum('total_price');
            $cart->save();

            DB::commit();

            return response()->json([
                'message' => 'Đã thêm sản phẩm vào giỏ hàng.',
                'cart' => $this->getCartResponse($cart, $request->lang_id),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error adding to cart: ' . $e->getMessage(), [
                'exception' => $e
            ]);
            return response()->json([
                'message' => 'Không thể thêm vào giỏ hàng: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $cartDetailId)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
            'lang_id' => 'required|exists:languages,id',
        ]);

        try {
            $sessionId = $request->session()->getId();
            $user = Auth::user();

            $cart = Cart::where(function ($query) use ($user, $sessionId) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
                ->where('status', 'pending')
                ->firstOrFail();

            $cartDetail = CartDetail::where('cart_id', $cart->id)
                ->where('id', $cartDetailId)
                ->firstOrFail();

            DB::beginTransaction();

            $cartDetail->quantity = $request->quantity;
            $cartDetail->total_price = $cartDetail->price * $request->quantity;
            $cartDetail->save();

            $cart->total_quantity = $cart->cartDetails()->sum('quantity');
            $cart->total_price = $cart->cartDetails()->sum('total_price');
            $cart->save();

            DB::commit();

            return response()->json([
                'message' => 'Đã cập nhật số lượng.',
                'cart' => $this->getCartResponse($cart, $request->lang_id),
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Không thể cập nhật giỏ hàng: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, $cartDetailId)
    {
        try {
            $sessionId = $request->session()->getId();
            $user = Auth::user();

            $cart = Cart::where(function ($query) use ($user, $sessionId) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
                ->where('status', 'pending')
                ->firstOrFail();

            $cartDetail = CartDetail::where('cart_id', $cart->id)
                ->where('id', $cartDetailId)
                ->firstOrFail();

            DB::beginTransaction();

            $cartDetail->delete();

            $cart->total_quantity = $cart->cartDetails()->sum('quantity');
            $cart->total_price = $cart->cartDetails()->sum('total_price');
            $cart->save();

            DB::commit();

            return response()->json([
                'message' => 'Đã xóa sản phẩm khỏi giỏ hàng.',
                'cart' => $this->getCartResponse($cart, $request->query('lang_id', 1)),
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Không thể xóa sản phẩm: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function clear(Request $request)
    {
        try {
            $sessionId = $request->session()->getId();
            $user = Auth::user();

            $cart = Cart::where(function ($query) use ($user, $sessionId) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
                ->where('status', 'pending')
                ->first();

            if (!$cart) {
                return response()->json([
                    'message' => 'Giỏ hàng đã trống.',
                ], 200);
            }

            DB::beginTransaction();

            $cart->cartDetails()->delete();
            $cart->total_quantity = 0;
            $cart->total_price = 0;
            $cart->save();

            DB::commit();

            return response()->json([
                'message' => 'Đã xóa toàn bộ giỏ hàng.',
                'cart' => $this->getCartResponse($cart, $request->query('lang_id', 1)),
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Không thể xóa giỏ hàng: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function getCartResponse(Cart $cart, $langId)
    {
        $cartDetails = CartDetail::with(['product', 'attributes'])
            ->where('cart_id', $cart->id)
            ->whereHas('product', function ($query) use ($langId) {
                $query->where('lang_id', $langId)->where('status', 'active');
            })
            ->get();

        $totalItems = $cartDetails->sum('quantity');
        $totalPrice = $cartDetails->sum('total_price');

        $cartItems = $cartDetails->map(function ($detail) {
            $variant = $detail->attributes->map(function ($attr) {
                return $attr->name . ($attr->color ? ' - ' . $attr->color : '');
            })->implode(', ');

            return [
                'id' => (string) $detail->id,
                'name' => $detail->product->name,
                'price' => $detail->price,
                'quantity' => $detail->quantity,
                'image' => $detail->product->image ? asset('storage/' . $detail->product->image) : '/placeholder.svg',
                'variant' => $variant ?: null,
                'product_id' => $detail->product_id,
            ];
        });

        return [
            'data' => $cartItems,
            'total_items' => $totalItems,
            'total_price' => $totalPrice,
        ];
    }
}
