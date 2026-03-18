<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Role\StoreRoleRquest;
use App\Http\Requests\Admin\Role\UpdateRoleRequest;
use App\Http\Resources\Admin\Role\RoleCollection;
use App\Http\Resources\Admin\Role\RoleResource;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\HttpCache\Store;
use Illuminate\Support\Facades\Log as FacadesLog;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $query = Role::query();
        if ($query->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }
        $sortBy = $request->get('sort_by', 'id');
        $sortDir = $request->get('sort_dir', 'asc');
        $perPage = $request->get('per_page', 10);
        $roles = $query->orderBy($sortBy, $sortDir)->paginate($perPage);
        return response()->json([
            'success' => true,
            'message' => 'lay danh sach vai tro thanh cong',
            'data' => new RoleCollection($roles)
        ]);
    }
    public function store(StoreRoleRquest $request)
    {
        try {
            DB::beginTransaction();
            $role = Role::create($request->validated());
            Log::add($request, 'Role Created', 'create', "Tạo role: {$role->name}");
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Role created successfully',
                'data' => new RoleCollection($role)
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create role'
            ], 500);
        }
    }
    public function show(Role $role)
    {
        return response()->json([
            'success' => true,
            'data'    => new RoleResource($role)
        ]);
    }
    public function update(UpdateRoleRequest $request, $id)
    {
        $role = Role::find($id);
        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy role'
            ], 404);
        }

        try {
            DB::beginTransaction();

            $role->update($request->validated());

            Log::add($request, 'Role Updated', 'update', "Sửa role: {$role->name}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật role thành công',
                'data'    => new RoleResource($role)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật role thất bại'
            ], 500);
        }
    }
    public function destroy(Request $request, $id)
    {
        $role = Role::find($id);
        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy role'
            ], 404);
        }

        try {
            DB::beginTransaction();

            Log::add($request, 'Role Deleted', 'delete', "Xóa role: {$role->name}");
            $role->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Xóa role thành công'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Xóa role thất bại'
            ], 500);
        }
    }
    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'exists:roles,id'
        ]);

        try {
            DB::beginTransaction();

            $roles = Role::whereIn('id', $request->ids)->get();

            foreach ($roles as $role) {
                $role->delete();
                Log::add($request, 'Role Deleted', 'delete', "Xóa role: {$role->name}");
            }

            DB::commit();

            return response()->json([
                'success'     => true,
                'message'     => 'Xóa nhiều role thành công',
                'deleted_ids' => $request->ids
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Xóa nhiều role thất bại'
            ], 500);
        }
    }
}
