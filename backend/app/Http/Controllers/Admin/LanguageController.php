<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Language\StoreLanguageRequest;
use App\Http\Requests\Admin\Language\UpdateLanguageRequest;
use App\Http\Resources\Admin\Language\LanguageResource;
use App\Models\Language;
use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Storage;

class LanguageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Language::query();
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('desc', 'like', '%' . $request->search . '%');
        }
        $sortBy = $request->get('sort_by', 'order');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);
        $languages = $query->get();
        return response()->json([
            'success' => true,
            'message' => "lay danh sach ngon ngu thanh cong",
            'data' => LanguageResource::collection($languages)
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreLanguageRequest $request)
    {
        try {
            DB::beginTransaction();

            $data = $request->only(([
                'name',
                'desc',
                'order',
                'status',
                'image'

            ]));
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('languages', $filename, 'public');
                $data['image'] = '/storage/' . $path;
            }
            $languages = Language::create($data);

            Log::add($request, 'language created', 'create', "tao ngon ngu :{$languages->name}");
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => "tao moi ngon ngu thanh cong",
                'data' => new LanguageResource($languages)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "tao moi ngon ngu that bai",
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Language $language)
    {
        return response()->json([
            'success' => true,
            'message' => "lay thong tin ngon ngu thanh cong",
            'data' => new LanguageResource($language)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateLanguageRequest $request, Language $language)
    {
        try {
            DB::beginTransaction();
            $data = $request->only([
                'name',
                'desc',
                'order',
                'status',
                'image'
            ]);
            if ($request->file('image')) {
                if ($language->image && Storage::disk('public')->exists(str_replace('/storage/', '', $language->image))) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $language->image));
                }
                $file = $request->file('image');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('languages', $filename, 'public');
                $data['image'] = '/storage/' . $path;
            }
            $language->update($data);
            Log::add($request, 'language updated', 'update', "cap nhat ngon ngu :{$language->name}");
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => "cap nhat ngon ngu thanh cong",
                'data' => new LanguageResource($language)
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => "cap nhat ngon ngu that bai",
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Language $language)
    {
        try {
            DB::beginTransaction();
            if ($language->image && Storage::disk('public')->exists(str_replace('/storage/', '', $language->image))) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $language->image));
            }
            $language->delete();
            Log::add($request, 'language deleted', 'delete', "xoa ngon ngu :{$language->name}");
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => "xoa ngon ngu thanh cong",
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => "xoa ngon ngu that bai",
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:languages,id',
        ]);
        try {
            DB::beginTransaction();
            $languages = Language::whereIn('id', $request->ids)->get();
            foreach ($languages as $language) {
                if ($language->image && Storage::disk('public')->exists(str_replace('/storage/', '', $language->image))) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $language->image));
                }
                $language->delete();
                Log::add($request, 'language deleted', 'delete', "xoa ngon ngu :{$language->name}");
            }
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => "xoa nhieu ngon ngu thanh cong",
                'delete_ids' => $request->ids
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => "xoa nhieu ngon ngu that bai",
                'error' => $e->getMessage()
            ], 500);
        }
    }
}