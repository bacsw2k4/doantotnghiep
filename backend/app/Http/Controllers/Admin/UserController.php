<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\User\StoreUserRequest;
use App\Http\Requests\Admin\User\UpdateUserRequest;
use App\Http\Resources\Admin\User\UserCollection;
use App\Http\Resources\Admin\User\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\HttpCache\Store;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('role');;
        if ($query->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('firstname', 'like', '%' . $request->search . '%')
                    ->orWhere('lastname',  'like', '%' . $request->search . '%')
                    ->orWhere('email',     'like', '%' . $request->search . '%')
                    ->orWhere('phone',     'like', '%' . $request->search . '%');
            });
        }
        $sortBy  = $request->get('sort_by', 'id');
        $sortDir = $request->get('sort_dir', 'asc');
        $perPage = $request->get('per_page', 10);
        $users = $query->orderBy($sortBy, $sortDir)->paginate($perPage);
        return response()->json([
            'success' => true,
            'message' => 'lay danh sach nguoi dung thanh cong',
            'data' => new UserCollection($users),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'has_more_pages' => $users->hasMorePages(),
            ]
        ]);
    }
    public function store(StoreUserRequest $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->only(['role_id', 'firstname', 'lastname', 'address', 'phone', 'email', 'status']);
            $data['password'] = Hash::make($request->password);
            $data['status'] = $request->status ?? 'active';
            if ($request->hasFile('avatar')) {
                $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
            }
            $user = User::create($data);
            Log::add($request, 'user created', 'create', "tao user {$request->email}");
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'tao user thanh cong',
                'data' => new UserResource($user->load('role'))
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Tạo user thất bại'
            ], 500);
        }
    }
    public function show($id)
    {
        $user = User::with('role')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy user'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new UserResource($user)
        ]);
    }
    public function update(UpdateUserRequest $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy user'
            ], 404);
        }

        try {
            DB::beginTransaction();

            $data = $request->only(['role_id', 'firstname', 'lastname', 'address', 'phone', 'email', 'status']);

            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            // Xử lý avatar
            if ($request->hasFile('avatar')) {
                // Có upload file mới
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }
                $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
            } elseif ($request->has('remove_avatar') && $request->remove_avatar == '1') {
                // Người dùng muốn xóa avatar hiện tại
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                    $data['avatar'] = null;
                }
            }

            $user->update($data);

            Log::add($request, 'User Updated', 'update', "Sửa user: {$user->email}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật user thành công',
                'data'    => new UserResource($user->load('role'))
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật user thất bại'
            ], 500);
        }
    }
    public function destroy(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy user'
            ], 404);
        }

        try {
            DB::beginTransaction();

            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $userEmail = $user->email;
            $user->delete();

            Log::add($request, 'User Deleted', 'delete', "Xóa user: {$userEmail}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Xóa user thành công'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Xóa user thất bại'
            ], 500);
        }
    }
    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'exists:users,id'
        ]);

        try {
            DB::beginTransaction();

            $users = User::whereIn('id', $request->ids)->get();

            foreach ($users as $user) {
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }
                $user->delete();
                Log::add($request, 'User Deleted', 'delete', "Xóa user: {$user->email}");
            }

            DB::commit();

            return response()->json([
                'success'     => true,
                'message'     => 'Xóa nhiều user thành công',
                'delete_ids'  => $request->ids
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Xóa nhiều user thất bại'
            ], 500);
        }
    }
}
