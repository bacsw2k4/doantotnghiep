<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Menu\StoreMenuRequest;
use App\Http\Requests\Admin\Menu\UpdateMenuRequest;
use App\Http\Resources\Admin\Menu\MenuCollection;
use App\Http\Resources\Admin\Menu\MenuResource;
use App\Models\Log;
use App\Models\Menu;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB as  FacadesLog;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);

        if ($request->filled('search')) {
            return $this->getFullTree($request);
        }

        $query = Menu::query()
            ->with(['language'])
            ->whereNull('parentid')
            ->select([
                'id',
                'lang_id',
                'parentid',
                'parentsid',
                'name',
                'url',
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
        $query->orderBy($sortBy, $sortDir)->orderBy('id', 'asc');

        $menus = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách menu thành công',
            'data' => new MenuCollection($menus),
            'meta' => [
                'current_page'   => $menus->currentPage(),
                'last_page'      => $menus->lastPage(),
                'per_page'       => $menus->perPage(),
                'total'          => $menus->total(),
                'has_more_pages' => $menus->hasMorePages(),
            ]
        ]);
    }

    public function getChildren($id, Request $request)
    {
        try {
            $children = Menu::where('parentid', $id)
                ->orderBy('order')
                ->orderBy('id')
                ->get();

            return response()->json([
                'success'    => true,
                'message'    => 'Lấy danh sách children thành công',
                'data'       => $children,
                'parent_id'  => $id
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
                    'message' => 'Thiếu lang_id'
                ], 400);
            }

            $query = Menu::query()
                ->with(['children.children'])
                ->where('lang_id', $langId);

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%");
                });
            }

            $query->orderBy('order')->orderBy('id');
            $allMenus = $query->get();

            $tree = $this->buildTree($allMenus);

            return response()->json([
                'success' => true,
                'message' => 'Lấy cây menu thành công',
                'data'    => $tree,
                'meta'    => [
                    'total'       => count($tree),
                    'search_mode' => true
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy cây menu'
            ], 500);
        }
    }

    private function buildTree($items, $parentId = null)
    {
        $branch = [];

        foreach ($items as $item) {
            if ($item->parentid == $parentId) {
                $children = $this->buildTree($items, $item->id);
                if (!empty($children)) {
                    $item->children = $children;
                }
                $branch[] = $item;
            }
        }

        return $branch;
    }

    public function store(StoreMenuRequest $request)
    {
        try {
            DB::beginTransaction();

            $data = $request->only([
                'lang_id',
                'parentid',
                'parentsid',
                'name',
                'desc',
                'content',
                'seotitle',
                'seodesc',
                'url',
                'params',
                'order',
                'status'
            ]);

            $menu = Menu::create($data);

            Log::add($request, 'Menu Created', 'create', "Tạo menu: {$menu->name}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo menu thành công',
                'data'    => new MenuResource($menu->load(['language', 'parent', 'children']))
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Tạo menu thất bại: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $menu = Menu::with(['language', 'parent', 'children'])->find($id);

        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy menu'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new MenuResource($menu)
        ]);
    }

    public function update(UpdateMenuRequest $request, $id)
    {
        $menu = Menu::find($id);
        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy menu'
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

            $data = $request->only([
                'lang_id',
                'parentid',
                'parentsid',
                'name',
                'desc',
                'content',
                'seotitle',
                'seodesc',
                'url',
                'params',
                'order',
                'status'
            ]);

            $menu->update($data);

            Log::add($request, 'Menu Updated', 'update', "Sửa menu: {$menu->name}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật menu thành công',
                'data'    => new MenuResource($menu->load(['language', 'parent', 'children']))
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật menu thất bại: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $menu = Menu::find($id);
        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy menu'
            ], 404);
        }

        try {
            DB::beginTransaction();
            $name = $menu->name;

            $this->deleteChildrenRecursively($menu);

            $menu->delete();

            Log::add($request, 'Menu Deleted', 'delete', "Xóa menu: {$name}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Xóa menu thành công'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Xóa menu thất bại: ' . $e->getMessage()
            ], 500);
        }
    }

    private function deleteChildrenRecursively(Menu $menu)
    {
        foreach ($menu->children as $child) {
            $this->deleteChildrenRecursively($child);
            $child->delete();
        }
    }

    public function destroyMultiple(Request $request)
    {
        $ids = $request->ids ?? [];
        if (empty($ids)) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa chọn menu để xóa'
            ], 400);
        }

        try {
            DB::beginTransaction();
            $menus = Menu::whereIn('id', $ids)->get();

            foreach ($menus as $menu) {
                $this->deleteChildrenRecursively($menu);
                $menu->delete();
                Log::add($request, 'Menu Deleted', 'delete', "Xóa menu: {$menu->name}");
            }

            DB::commit();

            return response()->json([
                'success'    => true,
                'message'    => 'Xóa nhiều menu thành công',
                'delete_ids' => $ids
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Xóa nhiều menu thất bại: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getMaxOrder(Request $request)
    {
        try {
            $request->validate([
                'parentid' => 'nullable|exists:menus,id',
                'lang_id'  => 'required|exists:languages,id'
            ]);

            $query = Menu::where('lang_id', $request->lang_id);

            if ($request->filled('parentid') && $request->parentid !== null) {
                $query->where('parentid', $request->parentid);
            } else {
                $query->whereNull('parentid');
            }

            $maxOrder = $query->max('order') ?? 0;

            return response()->json([
                'success' => true,
                'message' => 'Lấy max order thành công',
                'data'    => [
                    'max_order'       => $maxOrder,
                    'suggested_order' => $maxOrder + 1
                ]
            ]);
        } catch (\Exception $e) {
            FacadesLog::error('Get max order error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lấy max order thất bại'
            ], 500);
        }
    }

    public function getAllForDropdown(Request $request)
    {
        try {
            $request->validate([
                'lang_id' => 'required|exists:languages,id',
                'exclude_id' => 'nullable|exists:menus,id'
            ]);

            $langId = $request->lang_id;
            $excludeId = $request->exclude_id;

            $query = Menu::query()
                ->with(['children' => function ($query) use ($excludeId) {
                    if ($excludeId) {
                        $query->where('id', '!=', $excludeId);
                    }
                    $query->orderBy('order')->orderBy('id');
                }])
                ->where('lang_id', $langId)
                ->whereNull('parentid');

            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }

            $menus = $query->orderBy('order')->orderBy('id')->get();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách menu cho dropdown thành công',
                'data'    => $menus
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy menu dropdown: ' . $e->getMessage()
            ], 500);
        }
    }

    private function causesCycle(int $id, ?int $newParentId): bool
    {
        if ($newParentId === null) return false;

        $current = $newParentId;
        while ($current !== null) {
            if ($current === $id) return true;

            $parent = Menu::select('parentid')->find($current);
            if (!$parent) return false;

            $current = $parent->parentid;
        }
        return false;
    }
}