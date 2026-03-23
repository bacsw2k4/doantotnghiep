<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PromotionSubscriber\SendEmailRequest;
use App\Http\Requests\Admin\PromotionSubscriber\StorePromotionSubcriberRequest;
use App\Http\Requests\Admin\PromotionSubscriber\UpdatePromotionSubscriber;
use App\Http\Requests\Admin\PromotionSubscriber\UpdatePromotionSubscriberRequest;
use App\Http\Resources\Admin\PromotionSubscriber\PromotionSubscriberResource;
use App\Models\Log;
use App\Models\PromotionSubscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Mail\PromotionEmail;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpKernel\HttpCache\Store;

class PromotionSubscriberController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\PromotionSubscriber::query();
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', '%' . $search . '%');
            });
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $sortBy = $request->get('sort_by', 'subscribed_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $subscribers = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách người đăng ký thành công',
            'data'    => PromotionSubscriberResource::collection($subscribers)
        ]);
    }


    public function store(StorePromotionSubcriberRequest $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->only(['email', 'status']);
            $subscriber = PromotionSubscriber::create($data);
            Log::add($request, 'Promotion Subscriber Created', 'create', "Tạo người đăng ký: {$subscriber->email}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Thêm người đăng ký thành công',
                'data'    => new PromotionSubscriberResource($subscriber)
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error('Promotion subscriber creation failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi thêm người đăng ký: ' . $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Display the specified resource.
     */
    public function show(PromotionSubscriber $promotionSubscriber)
    {
        return response()->json([
            'success' => true,
            'data'    => new PromotionSubscriberResource($promotionSubscriber)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePromotionSubscriberRequest $request, PromotionSubscriber $promotionSubscriber)
    {
        try {
            DB::beginTransaction();

            $data = $request->only([
                'email',
                'status'
            ]);
            FacadesLog::info($data);
            $promotionSubscriber->update($data);

            Log::add($request, 'Promotion Subscriber Updated', 'update', "Cập nhật người đăng ký: {$promotionSubscriber->email}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật người đăng ký thành công',
                'data'    => new PromotionSubscriberResource($promotionSubscriber)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error('Promotion subscriber update failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật người đăng ký thất bại: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, PromotionSubscriber $promotionSubscriber)
    {
        try {
            DB::beginTransaction();
            $email = $promotionSubscriber->email;
            $promotionSubscriber->delete();

            Log::add($request, 'Promotion Subscriber Deleted', 'delete', "Xóa người đăng ký: {$email}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Xóa người đăng ký thành công'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error('Promotion subscriber deletion failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Xóa người đăng ký thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'exists:promotion_subscribers,id'
        ]);

        try {
            DB::beginTransaction();
            $subscribers = PromotionSubscriber::whereIn('id', $request->ids)->get();

            foreach ($subscribers as $subscriber) {
                $subscriber->delete();
                Log::add($request, 'Promotion Subscriber Deleted', 'delete', "Xóa người đăng ký: {$subscriber->email}");
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Xóa nhiều người đăng ký thành công',
                'delete_ids' => $request->ids
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error('Multiple promotion subscriber deletion failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Xóa nhiều người đăng ký thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
    public function sendEmail(SendEmailRequest $request)
    {
        try {
            DB::beginTransaction();

            $subject = $request->subject;
            $content = $request->content;
            $ids = $request->ids ?? [];

            $query = PromotionSubscriber::where('status', 'active');

            if (!empty($ids)) {
                $query->whereIn('id', $ids);
            }

            $subscribers = $query->get();

            if ($subscribers->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có người đăng ký nào để gửi email'
                ], 400);
            }

            $sentCount = 0;
            $failedEmails = [];

            foreach ($subscribers as $subscriber) {
                try {
                    Mail::to($subscriber->email)
                        ->send(new PromotionEmail($subject, $content));
                    $sentCount++;
                } catch (\Exception $e) {
                    $failedEmails[] = [
                        'email' => $subscriber->email,
                        'error' => $e->getMessage()
                    ];
                    FacadesLog::error('Failed to send email to ' . $subscriber->email, [
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::add(
                $request,
                'Promotion Email Sent',
                'email',
                "Đã gửi email khuyến mãi cho {$sentCount} người đăng ký. " .
                    ($failedEmails ? "Lỗi: " . count($failedEmails) . " email" : "")
            );

            DB::commit();

            $response = [
                'success' => true,
                'message' => "Đã gửi email thành công cho {$sentCount} người đăng ký",
                'data' => [
                    'sent_count' => $sentCount,
                    'total' => $subscribers->count()
                ]
            ];

            if (!empty($failedEmails)) {
                $response['failed_emails'] = $failedEmails;
                $response['message'] .= " (có " . count($failedEmails) . " email gửi thất bại)";
            }

            return response()->json($response);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error('Send promotion email failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gửi email thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
}