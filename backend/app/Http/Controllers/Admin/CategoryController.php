<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Category\StoreCategoryRequest;
use App\Http\Requests\Admin\Category\UpdateCategoryRequest;
use App\Http\Resources\Admin\Category\CategoryResource;
use App\Models\Category;
use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{

    public function index(Request $request)
    {
        $query = Category::query()->with(['language']);
        if ($request->has('lang_id')) {
            $query->where('lang_id', $request->lang_id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $sortBy = $request->get('sort_by', 'order');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        $categories = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách danh mục thành công',
            'data'    => CategoryResource::collection($categories)
        ]);
    }


    public function store(StoreCategoryRequest $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->only([
                'lang_id',
                'name',
                'desc',
                'content',
                'seotitle',
                'seodesc',
                'url',
                'attribute',
                'order',
                'status'
            ]);
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('categories', $filename, 'public');
                $data['image'] = '/storage/' . $path;
            }

            $category = Category::create($data);
            Log::add($request, 'Category Created', 'create', "Tạo category: {$category->name}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo category thành công',
                'data'    => new CategoryResource($category->load(['language']))
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error('Category creation failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Tạo danh mục thất bại: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $category = Category::with(['language'])->find($id);
        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy danh mục'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new CategoryResource($category)
        ]);
    }


    public function update(UpdateCategoryRequest $request, Category $category)
    {
        try {
            DB::beginTransaction();

            $data = $request->only([
                'lang_id',
                'name',
                'desc',
                'content',
                'seotitle',
                'seodesc',
                'url',
                'attribute',
                'order',
                'status'
            ]);

            if ($request->hasFile('image')) {
                if ($category->image) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $category->image));
                }
                $path = $request->file('image')->store('categories', 'public');
                $data['image'] = Storage::url($path);
            } elseif ($request->has('image_url')) {
                $imageUrl = $request->input('image_url');
                if (empty($imageUrl) || $imageUrl === '' || $imageUrl === null) {
                    if ($category->image) {
                        Storage::disk('public')->delete(str_replace('/storage/', '', $category->image));
                    }
                    $data['image'] = null;
                }
            }

            $category->update($data);

            Log::add($request, 'Category Updated', 'update', "Sửa category: {$category->name}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật category thành công',
                'data'    => new CategoryResource($category->load(['language']))
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error('Category update failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật category thất bại: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Category $category)
    {
        try {
            DB::beginTransaction();
            $name = $category->name;
            $category->delete();
            Log::add($request, 'Category Deleted', 'delete', "Xóa danh mục: {$name}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Xóa danh mục thành công'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error('Category deletion failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Xóa danh mục thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'exists:categories,id'
        ]);

        try {
            DB::beginTransaction();
            $categories = Category::whereIn('id', $request->ids)->get();

            foreach ($categories as $cat) {
                $cat->delete();
                Log::add($request, 'Category Deleted', 'delete', "Xóa danh mục: {$cat->name}");
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Xóa nhiều danh mục thành công',
                'delete_ids' => $request->ids
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error('Multiple category deletion failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Xóa nhiều danh mục thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
}