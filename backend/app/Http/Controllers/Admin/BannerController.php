<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Banner\StoreBannerRequest;
use App\Http\Requests\Admin\Banner\UpdateBannerRequest;
use App\Http\Resources\Admin\Banner\BannerResource;
use App\Models\Banner;
use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Storage;

class BannerController extends Controller
{

    public function index(Request $request)
    {
        $query = Banner::query()->with('language');
        if ($request->has('lang_id')) {
            $query->where('lang_id', $request->lang_id);
        }
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }
        $sortBy = $request->get('sort_by', 'order');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);
        $banner = $query->get();
        return response()->json([
            'success' => true,
            'message' => "Lấy danh sách banner thành công",
            'data' => BannerResource::collection($banner)
        ]);
    }


    public function store(StoreBannerRequest $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->only([
                'lang_id',
                'title',
                'subtitle',
                'description',
                'cta_text',
                'cta_link',
                'badge',
                'theme',
                'order',
                'status'
            ]);
            FacadesLog::info($request);
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('banners', 'public');
                $data['image'] = Storage::url($path);
            }
            $banner = Banner::create($data);
            Log::add($request, 'Banner Created', 'create', "Tạo banner: {$banner->title}");
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => "Tạo banner thành công",
                'data' => new BannerResource($banner)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => "Tạo banner thất bại : " . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $banner = Banner::with('language')->find($id);
        if (!$banner) {
            return response()->json([
                'success' => false,
                'message' => "Không tìm thấy banner"
            ], 404);
        }
        return response()->json([
            'success' => true,
            'data' => new BannerResource($banner)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBannerRequest $request,  $id)
    {
        $banner = Banner::find($id);
        if (!$banner) {
            return response()->json([
                'success' => false,
                'message' => "Không tìm thấy banner"
            ], 404);
        }
        try {
            DB::beginTransaction();
            $data = $request->only([
                'lang_id',
                'title',
                'subtitle',
                'description',
                'cta_text',
                'cta_link',
                'badge',
                'theme',
                'order',
                'status'
            ]);
            if ($request->hasFile('image')) {
                // Có upload file mới
                if ($banner->image) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $banner->image));
                }
                $path = $request->file('image')->store('banners', 'public');
                $data['image'] = Storage::url($path);
            } elseif ($request->has('image_url')) {
                $imageUrl = $request->input('image_url');

                if (empty($imageUrl) || $imageUrl === '') {
                    if ($banner->image) {
                        Storage::disk('public')->delete(str_replace('/storage/', '', $banner->image));
                    }
                    $data['image'] = null;
                }
            }
            $banner->update($data);
            Log::add($request, 'Banner Updated', 'update', "Cập nhật banner: {$banner->title}");
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => "Cập nhật banner thành công",
                'data' => new BannerResource($banner)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => "Cập nhật banner thất bại : " . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $banner = Banner::find($id);
        if (!$banner) {
            return response()->json([
                'success' => false,
                'message' => 'khong tìm thấy banner'
            ]);
        }
        try {
            DB::beginTransaction();
            if ($banner->image) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $banner->image));
            }
            $banner->delete();
            Log::add($request, 'Banner Deleted', 'delete', "Xóa banner: {$banner->title}");
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => "Xóa banner thành công"
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => "Xóa banner thất bại : " . $e->getMessage(),
            ], 500);
        }
    }
    public function destroyMultiple(Request $request)
    {
        $ids = $request->ids ?? [];
        if (empty($ids)) {
            return response()->json([
                'success' => false,
                'message' => "Không có banner nào được chọn để xóa"
            ]);
        }
        try {
            DB::beginTransaction();
            foreach ($ids as $id) {
                $banner = Banner::find($id);
                if ($banner) {
                    if ($banner->image) {
                        Storage::disk('public')->delete(str_replace('/storage/', '', $banner->image));
                    }
                    Log::add($request, 'Banner Deleted', 'delete', "Xóa banner: {$banner->title}");
                    $banner->delete();
                }
            }
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => "Xóa nhiều banner thành công"
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => "Xóa nhiều banner thất bại : " . $e->getMessage(),
            ], 500);
        }
    }
}
