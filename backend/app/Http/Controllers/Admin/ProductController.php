<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Product\StoreProductRequest;
use App\Http\Requests\Admin\Product\UpdateProductRequest;
use App\Http\Resources\Admin\Product\ProductCollection;
use App\Http\Resources\Admin\Product\ProductResource;
use App\Models\Log;
use App\Models\Product;
use App\Models\SubProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Product::with(['language', 'category', 'subProducts']);
        if ($request->has('lang_id')) {
            $query->where('lang_id', $request->lang_id);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('desc', 'like', "%{$search}%");
            });
        }
        if ($request->filled('category_ids')) {
            $categoryIds = explode(',', $request->category_ids);
            $query->whereHas('categories', fn($q) => $q->whereIn('categories.id', $categoryIds));
        }
        $products = $query->paginate($request->get('per_page', 10));
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách product thành công',
            'data'    => new ProductCollection($products),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'has_more_pages' => $products->hasMorePages(),
            ]
        ]);
    }


    public function store(StoreProductRequest $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->only([
                'lang_id',
                'name',
                'desc',
                'content',
                'attribute',
                'url',
                'author',
                'seotitle',
                'seodesc',
                'price',
                'saleprice',
                'order',
                'status'
            ]);
            $product = Product::create($data);
            // Upload ảnh chính
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store("products/{$product->id}", 'public');
                $product->update(['image' => $path]);
            }

            // Categories
            if ($request->has('categories')) {
                $product->categories()->attach($request->categories);
            }

            // Sub products + images - FIXED: Parse JSON từ frontend
            if ($request->has('sub_products')) {
                $subData = $request->input('sub_products', []);
                $subFiles = $request->file('sub_images', []);

                foreach ($subData as $index => $item) {
                    // Parse JSON nếu frontend gửi dạng string
                    $subItemData = is_string($item) ? json_decode($item, true) : $item;

                    $sub = [
                        'product_id' => $product->id,
                        'title'      => $subItemData['title'] ?? null,
                    ];

                    if (isset($subFiles[$index])) {
                        $sub['image'] = $subFiles[$index]->store("sub_products/{$product->id}", 'public');
                    }

                    SubProduct::create($sub);
                }
            }

            Log::add($request, 'Product Created', 'create', "Tạo product: {$product->name}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo product thành công',
                'data'    => new ProductResource($product->load(['language', 'categories', 'subProducts']))
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Product store failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Tạo product thất bại',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $product = Product::with(['language', 'categories', 'subProducts'])->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy product'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new ProductResource($product)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductRequest $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy product'], 404);
        }

        try {
            DB::beginTransaction();

            $product->update($request->only([
                'lang_id',
                'name',
                'desc',
                'content',
                'attribute',
                'url',
                'author',
                'seotitle',
                'seodesc',
                'price',
                'saleprice',
                'order',
                'status'
            ]));

            // Ảnh chính
            if ($request->hasFile('image')) {
                if ($product->image) Storage::disk('public')->delete($product->image);
                $path = $request->file('image')->store("products/{$product->id}", 'public');
                $product->update(['image' => $path]);
            }

            // Categories
            if ($request->has('categories')) {
                $product->categories()->sync($request->categories);
            }

            // Xử lý Sub products - FIXED
            if ($request->has('sub_products') || $request->hasFile('sub_images')) {
                $subData = $request->input('sub_products', []);
                $subFiles = $request->file('sub_images', []);

                // Lấy danh sách ID hiện có
                $existingSubIds = $product->subProducts->pluck('id')->toArray();
                $receivedSubIds = [];

                foreach ($subData as $index => $item) {
                    $subItemData = is_string($item) ? json_decode($item, true) : $item;

                    $sub = [
                        'product_id' => $product->id,
                        'title' => $subItemData['title'] ?? null
                    ];

                    $subProductId = $subItemData['id'] ?? null;

                    // Nếu có ID, đây là update bản ghi cũ
                    if ($subProductId && in_array($subProductId, $existingSubIds)) {
                        $subProduct = SubProduct::find($subProductId);

                        // Xử lý ảnh
                        if (isset($subFiles[$index])) {
                            // Xóa ảnh cũ nếu có
                            if ($subProduct->image) {
                                Storage::disk('public')->delete($subProduct->image);
                            }
                            $sub['image'] = $subFiles[$index]->store("sub_products/{$product->id}", 'public');
                        } elseif (isset($subItemData['image']) && $subItemData['image'] === '') {
                            // Xóa ảnh nếu gửi string rỗng
                            if ($subProduct->image) {
                                Storage::disk('public')->delete($subProduct->image);
                                $sub['image'] = null;
                            }
                        }

                        $subProduct->update($sub);
                        $receivedSubIds[] = $subProductId;
                    } else {
                        // Tạo mới
                        if (isset($subFiles[$index])) {
                            $sub['image'] = $subFiles[$index]->store("sub_products/{$product->id}", 'public');
                        }

                        $newSub = SubProduct::create($sub);
                        $receivedSubIds[] = $newSub->id;
                    }
                }

                // Xóa các subproduct không còn tồn tại trong request
                $idsToDelete = array_diff($existingSubIds, $receivedSubIds);
                if (!empty($idsToDelete)) {
                    $subsToDelete = SubProduct::whereIn('id', $idsToDelete)->get();
                    foreach ($subsToDelete as $subToDelete) {
                        if ($subToDelete->image) {
                            Storage::disk('public')->delete($subToDelete->image);
                        }
                        $subToDelete->delete();
                    }
                }
            }

            Log::add($request, 'Product Updated', 'update', "Sửa product: {$product->name}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật product thành công',
                'data'    => new ProductResource($product->load(['language', 'categories', 'subProducts']))
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Product update failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật product thất bại: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $product = Product::with('subProducts')->find($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy product'], 404);
        }

        try {
            DB::beginTransaction();

            if ($product->image) Storage::disk('public')->delete($product->image);
            foreach ($product->subProducts as $sub) {
                if ($sub->image) Storage::disk('public')->delete($sub->image);
                $sub->delete();
            }

            $name = $product->name;
            $product->delete();

            Log::add($request, 'Product Deleted', 'delete', "Xóa product: {$name}");
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Xóa product thành công']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Xóa product thất bại'], 500);
        }
    }
    public function destroyMultiple(Request $request)
    {
        $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'exists:products,id']);

        try {
            DB::beginTransaction();
            $products = Product::with('subProducts')->whereIn('id', $request->ids)->get();

            foreach ($products as $product) {
                if ($product->image) Storage::disk('public')->delete($product->image);
                foreach ($product->subProducts as $sub) {
                    if ($sub->image) Storage::disk('public')->delete($sub->image);
                    $sub->delete();
                }
                $product->delete();
                Log::add($request, 'Product Deleted', 'delete', "Xóa product: {$product->name}");
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Xóa nhiều product thành công',
                'deleted_ids' => $request->ids
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Xóa nhiều product thất bại'], 500);
        }
    }
}