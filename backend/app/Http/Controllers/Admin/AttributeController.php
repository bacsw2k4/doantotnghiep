<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Attribute\StoreAttributeRequest;
use App\Http\Requests\Admin\Attribute\UpdateAttributeRequest;
use App\Http\Resources\Admin\Attribute\AttributeCollection;
use App\Http\Resources\Admin\Attribute\AttributeResource;
use App\Http\Resources\Admin\Attribute\AtttributeCollection;
use App\Models\Attribute;
use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log as FacadesLog;

class AttributeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        if ($request->filled('search')) {
            return;
        }
        $query = Attribute::query()
            ->with(['language'])
            ->whereNull('parentid')
            ->select([
                'id',
                'lang_id',
                'parentid',
                'name',
                'type',
                'color',
                'image',
                'order',
                'status',
                'created_at',
                'updated_at'
            ]);

        if ($request->has('lang_id')) {
            $query->where('lang_id', $request->lang_id);
        }

        $sortBy  = $request->get('sort_by', 'order');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);
        $query->orderBy('id', 'asc');

        $attributes = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách attribute thành công',
            'data' => new AttributeCollection($attributes),
            'meta' => [
                'current_page' => $attributes->currentPage(),
                'last_page' => $attributes->lastPage(),
                'per_page' => $attributes->perPage(),
                'total' => $attributes->total(),
                'has_more_pages' => $attributes->hasMorePages(),
            ]
        ]);
    }
    //convert img de Fe goi duoc luon
    private function convertImageUrls($attributes)
    {
        foreach ($attributes as $attribute) {
            if ($attribute->image) {
                if (!filter_var($attribute->image, FILTER_VALIDATE_URL)) {
                    $attribute->image = url($attribute->image);
                }
            }

            if ($attribute->children && count($attribute->children) > 0) {
                $this->convertImageUrls($attribute->children);
            }
        }

        return $attributes;
    }
    public function getChildren($id, Request $request)
    {
        try {
            $children = Attribute::where('parentid', $id)
                ->orderBy('order')
                ->orderBy('id')
                ->get();

            $this->convertImageUrls($children);

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách children thành công',
                'data' => $children,
                'parent_id' => $id
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy children'
            ], 500);
        }
    }
    public function getFullTree(Request $request)
    {
        try {
            $langId = $request->get('lang_id');
            $search = $request->get('search');
            if (!$langId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Thieu lang_id'
                ], 400);
            }
            $query = Attribute::query()->with(['children.children'])->where('lang_id', $langId);
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%");
                });
            }
            $query->orderBy('order')->orderBy('id');
            $allAttributes = $query->get();
            $tree = $this->buildTree($allAttributes);

            $this->convertImageUrls($tree);

            return response()->json([
                'success' => true,
                'message' => 'Lấy cây attribute thành công',
                'data' => $tree,
                'meta' => [
                    'total' => count($tree),
                    'search_mode' => true
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy cây attribute'
            ], 500);
        }
    }
    //// Xây dựng cây từ danh sách phẳng
    private function buildTree($items, $parentId = null)
    {
        /// Mảng chứa các node con của parent hiện tại
        $branch = [];
        // Duyệt toàn bộ danh sách item
        foreach ($items as $item) {
            // Nếu item là con của parent hiện tại
            if ($item->parentid == $parentId) {
                //Gọi đệ quy để tìm các con của item hiện tại
                $children = $this->buildTree($items, $item->id);
                //Nếu item có con thì gán vào children
                if (!empty($children)) {
                    $item->children = $children;
                }
                //Thêm item vào danh sách con
                $branch[] = $item;
            }
        }
        //Trả về danh sách node con của parent hiện tại
        return $branch;
    }



    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAttributeRequest $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->only(['lang_id', 'parentid', 'name', 'type', 'color', 'order', 'status']);

            // Upload image nếu có
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('attributes', 'public');
                $data['image'] = Storage::url($path);
            }

            $attribute = Attribute::create($data);

            Log::add($request, 'Attribute Created', 'create', "Tạo attribute: {$attribute->name}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo attribute thành công',
                'data'    => new AttributeResource($attribute)
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Tạo attribute thất bại: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $attribute = Attribute::with('language', 'parent', 'children')->find($id);
        if (!$attribute) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy attribute'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new AttributeResource($attribute)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAttributeRequest $request, $id)
    {
        $attribute = Attribute::find($id);
        if (!$attribute) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy attribute'
            ], 404);
        }

        if ($request->has('parentid') && $this->causesCycle($id, $request->parentid)) {
            return response()->json([
                'success' => false,
                'message' => 'Parent không hợp lệ, sẽ gây vòng lặp'
            ], 422);
        }

        try {
            DB::beginTransaction();
            $data = $request->only(['lang_id', 'parentid', 'name', 'type', 'color', 'order', 'status']);

            FacadesLog::info($request);

            if ($request->hasFile('image')) {
                if ($attribute->image) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $attribute->image));
                }
                $path = $request->file('image')->store('attributes', 'public');
                $data['image'] = Storage::url($path);
            } elseif ($request->has('image_url')) {
                $imageUrl = $request->input('image_url');

                if (empty($imageUrl)) {
                    // Xóa ảnh cũ nếu có
                    if ($attribute->image) {
                        Storage::disk('public')->delete(str_replace('/storage/', '', $attribute->image));
                    }
                    $data['image'] = null;
                } else {
                    $data['image'] = $imageUrl;
                }
            }

            $attribute->update($data);

            Log::add($request, 'Attribute Updated', 'update', "Sửa attribute: {$attribute->name}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật attribute thành công',
                'data'    => new AttributeResource($attribute)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật attribute thất bại: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $attribute = Attribute::find($id);
        if (!$attribute) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy attribute'
            ], 404);
        }

        try {
            DB::beginTransaction();
            $attributeName = $attribute->name;

            if ($attribute->image) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $attribute->image));
            }

            $attribute->delete();

            Log::add($request, 'Attribute Deleted', 'delete', "Xóa attribute: {$attributeName}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Xóa attribute thành công'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Xóa attribute thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
    public function destroyMultiple(Request $request)
    {
        $ids = $request->ids ?? [];
        if (empty($ids)) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa chọn attribute để xóa'
            ], 400);
        }

        try {
            DB::beginTransaction();
            $attributes = Attribute::whereIn('id', $ids)->get();

            foreach ($attributes as $attribute) {
                if ($attribute->image) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $attribute->image));
                }
                $attribute->delete();
                Log::add($request, 'Attribute Deleted', 'delete', "Xóa attribute: {$attribute->name}");
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Xóa nhiều attribute thành công',
                'delete_ids' => $ids
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Xóa nhiều attribute thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
    public function getMaxOrder(Request $request)
    {
        try {
            $request->validate([
                'parentid' => 'nullable|exists:attributes,id',
                'lang_id' => 'required|exists:languages,id'
            ]);

            FacadesLog::info('buihobac');

            $query = Attribute::where('lang_id', $request->lang_id);

            if ($request->has('parentid') && $request->parentid) {
                $query->where('parentid', $request->parentid);
            } else {
                $query->whereNull('parentid');
            }

            $maxOrder = $query->max('order') ?? 0;

            return response()->json([
                'success' => true,
                'message' => 'Lấy max order thành công',
                'data' => [
                    'max_order' => $maxOrder,
                    'suggested_order' => $maxOrder + 1
                ]
            ]);
        } catch (\Exception $e) {
            FacadesLog::error('Get max order error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lấy max order thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
    //chống lặp vô hạn 
    private function causesCycle($id, $parentId)
    {
        if ($parentId === null) {
            return false;
        }

        $current = $parentId;
        while ($current !== null) {
            if ($current === $id) {
                return true;
            }
            $parent = Attribute::select('parentid')->find($current);
            if (!$parent) {
                return false;
            }
            $current = $parent->parentid;
        }
        return false;
    }
}
