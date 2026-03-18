<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Voucher\StoreVoucherRequest;
use App\Http\Requests\Admin\Voucher\UpdateVoucherRequest;
use App\Http\Resources\Admin\Voucher\VoucherCollection;
use App\Http\Resources\Admin\Voucher\VoucherResource;
use App\Models\Log;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Storage;

class VoucherController extends Controller
{
    public function index(Request $request)
    {
        $query = Voucher::query();
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', '%' . $request->search . '%')
                    ->orWhere('name', 'like', '%' . $request->search . '%');
            });
        }
        // Sửa lại phần sort để dùng created_at thay vì createdate
        $sortBy  = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $perPage = $request->get('per_page', 10); // Thêm phân trang
        // Thay get() bằng paginate()
        $vouchers = $query->orderBy($sortBy, $sortDir)->paginate($perPage);
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách voucher thành công',
            'data'    => new VoucherCollection($vouchers), // Dùng Collection thay vì Resource
            'meta' => [
                'current_page' => $vouchers->currentPage(),
                'last_page' => $vouchers->lastPage(),
                'per_page' => $vouchers->perPage(),
                'total' => $vouchers->total(),
                'has_more_pages' => $vouchers->hasMorePages(),
            ]
        ]);
    }
    public function store(StoreVoucherRequest $request)
    {
        try {
            DB::beginTransaction();

            $data = $request->only(['code', 'name', 'type', 'discount', 'minmoney', 'status', 'enddate']);

            if ($request->hasFile('image')) {
                $data['image'] = $request->file('image')->store('vouchers', 'public');
            }

            $voucher = Voucher::create($data);

            Log::add($request, 'Voucher Created', 'create', "Tạo voucher: {$voucher->code}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo voucher thành công',
                'data'    => new VoucherResource($voucher)
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error('Voucher store failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Tạo voucher thất bại'
            ], 500);
        }
    }
    public function show($id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy voucher'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new VoucherResource($voucher)
        ]);
    }
    public function update(UpdateVoucherRequest $request, $id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy voucher'
            ], 404);
        }

        try {
            DB::beginTransaction();

            $data = $request->only(['code', 'name', 'type', 'discount', 'minmoney', 'status', 'enddate']);

            // Xử lý xóa ảnh nếu có remove_image
            if ($request->has('remove_image') && $request->remove_image == '1') {
                if ($voucher->image) {
                    Storage::disk('public')->delete($voucher->image);
                    $data['image'] = null;
                }
            }
            // Xử lý upload ảnh mới
            elseif ($request->hasFile('image')) {
                // Xóa ảnh cũ
                if ($voucher->image) {
                    Storage::disk('public')->delete($voucher->image);
                }
                $data['image'] = $request->file('image')->store('vouchers', 'public');
            }

            $voucher->update($data);

            Log::add($request, 'Voucher Updated', 'update', "Sửa voucher: {$voucher->code}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật voucher thành công',
                'data'    => new VoucherResource($voucher)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error('Voucher update failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật voucher thất bại'
            ], 500);
        }
    }
    public function destroy(Request $request, $id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy voucher'
            ], 404);
        }

        try {
            DB::beginTransaction();

            if ($voucher->image) {
                Storage::disk('public')->delete($voucher->image);
            }

            $code = $voucher->code;
            $voucher->delete();

            Log::add($request, 'Voucher Deleted', 'delete', "Xóa voucher: {$code}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Xóa voucher thành công'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Xóa voucher thất bại'
            ], 500);
        }
    }
    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'exists:vouchers,id'
        ]);

        try {
            DB::beginTransaction();

            $vouchers = Voucher::whereIn('id', $request->ids)->get();

            foreach ($vouchers as $voucher) {
                if ($voucher->image) {
                    Storage::disk('public')->delete($voucher->image);
                }
                $voucher->delete();
                Log::add($request, 'Voucher Deleted', 'delete', "Xóa voucher: {$voucher->code}");
            }

            DB::commit();

            return response()->json([
                'success'     => true,
                'message'     => 'Xóa nhiều voucher thành công',
                'deleted_ids' => $request->ids
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Xóa nhiều voucher thất bại'
            ], 500);
        }
    }
}