<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\Footer\FooterResource;
use App\Models\Footer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Storage;

class FooterController extends Controller
{
    public function index(Request $request)
    {
        $query = Footer::query()->with('language');
        if ($query->has('lang_id')) {
            $query->where('lang_id', $request->lang_id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $sortBy = $request->get('sort_by', 'order');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        $cacheKey = 'admin_footers_' . md5(serialize($request->all()));
        $footers = Cache::remember($cacheKey, now()->addMinutes(60), function () use ($query) {
            return $query->get();
        });

        return FooterResource::collection($footers);
    }
    public function store(Request $request)
    {
        $request->validate([
            'lang_id' => 'required|exists:languages,id',
            'company' => 'nullable|array',
            'support' => 'nullable|array',
            'categories' => 'nullable|array',
            'legal' => 'nullable|array',
            'features' => 'nullable|array',
            'company_description' => 'nullable|string',
            'contact_address' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'contact_email' => 'nullable|email|max:255',
            'social_facebook' => 'nullable|url',
            'social_instagram' => 'nullable|url',
            'social_twitter' => 'nullable|url',
            'social_youtube' => 'nullable|url',
            'bottom_copyright' => 'nullable|string',
            'badges' => 'nullable|array',
            'payment_methods' => 'nullable|array',
            'payment_methods.*.name' => 'required_with:payment_methods|string',
            'payment_methods.*.logo' => 'required_with:payment_methods|image|mimes:jpeg,png,jpg,gif|max:2048',
            'status' => 'in:active,inactive',
            'order' => 'integer',
        ]);
        try {
            DB::beginTransaction();

            $data = $request->only([
                'lang_id',
                'company',
                'support',
                'categories',
                'legal',
                'features',
                'company_description',
                'contact_address',
                'contact_phone',
                'contact_email',
                'social_facebook',
                'social_instagram',
                'social_twitter',
                'social_youtube',
                'bottom_copyright',
                'badges',
                'status',
                'order',
            ]);

            // Handle payment_methods image uploads
            if ($request->has('payment_methods')) {
                $paymentMethods = [];
                foreach ($request->payment_methods as $index => $method) {
                    $logoPath = null;
                    if ($request->hasFile("payment_methods.$index.logo")) {
                        $logoPath = $request->file("payment_methods.$index.logo")->store('payment-methods', 'public');
                    }
                    $paymentMethods[] = [
                        'name' => $method['name'],
                        'logo' => $logoPath ? Storage::url($logoPath) : null,
                    ];
                }
                $data['payment_methods'] = $paymentMethods;
            }

            $footer = Footer::create($data);

            Cache::forget("footers_lang_{$footer->lang_id}");
            Cache::forget('admin_footers_' . md5(serialize(['lang_id' => $footer->lang_id])));

            Log::add($request, 'Footer Created', 'create', "Tạo footer: lang_id {$footer->lang_id}");
            DB::commit();

            return new FooterResource($footer);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Tạo footer thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
    public function show($id)
    {
        $footer = Footer::with('language')->find($id);
        if (!$footer) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy footer'
            ], 404);
        }
        return new FooterResource($footer);
    }
    public function update(Request $request, $id)
    {
        $footer = Footer::find($id);
        if (!$footer) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy footer'
            ], 404);
        }

        $request->validate([
            'lang_id' => 'sometimes|required|exists:languages,id',
            'company' => 'nullable|array',
            'support' => 'nullable|array',
            'categories' => 'nullable|array',
            'legal' => 'nullable|array',
            'features' => 'nullable|array',
            'company_description' => 'nullable|string',
            'contact_address' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'contact_email' => 'nullable|email|max:255',
            'social_facebook' => 'nullable|url',
            'social_instagram' => 'nullable|url',
            'social_twitter' => 'nullable|url',
            'social_youtube' => 'nullable|url',
            'bottom_copyright' => 'nullable|string',
            'badges' => 'nullable|array',
            'payment_methods' => 'nullable|array',
            'payment_methods.*.name' => 'required_with:payment_methods|string',
            'payment_methods.*.logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'status' => 'in:active,inactive',
            'order' => 'integer',
        ]);

        try {
            DB::beginTransaction();

            $data = $request->only([
                'lang_id',
                'company',
                'support',
                'categories',
                'legal',
                'features',
                'company_description',
                'contact_address',
                'contact_phone',
                'contact_email',
                'social_facebook',
                'social_instagram',
                'social_twitter',
                'social_youtube',
                'bottom_copyright',
                'badges',
                'status',
                'order',
            ]);

            // Handle payment_methods image uploads
            if ($request->has('payment_methods')) {
                $paymentMethods = [];
                foreach ($request->payment_methods as $index => $method) {
                    $logoPath = $method['logo'] ?? null;
                    if ($request->hasFile("payment_methods.$index.logo")) {
                        $logoPath = $request->file("payment_methods.$index.logo")->store('payment-methods', 'public');
                        $logoPath = Storage::url($logoPath);
                    }
                    $paymentMethods[] = [
                        'name' => $method['name'],
                        'logo' => $logoPath,
                    ];
                }
                $data['payment_methods'] = $paymentMethods;
            }

            $oldLangId = $footer->lang_id;
            $footer->update($data);

            Cache::forget("footers_lang_{$oldLangId}");
            Cache::forget("footers_lang_{$footer->lang_id}");
            Cache::forget('admin_footers_' . md5(serialize(['lang_id' => $oldLangId])));
            Cache::forget('admin_footers_' . md5(serialize(['lang_id' => $footer->lang_id])));

            Log::add($request, 'Footer Updated', 'update', "Sửa footer: lang_id {$footer->lang_id}");
            DB::commit();

            return new FooterResource($footer);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật footer thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
    public function destroy(Request $request, $id)
    {
        $footer = Footer::find($id);
        if (!$footer) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy footer'
            ], 404);
        }

        try {
            DB::beginTransaction();
            $langId = $footer->lang_id;
            $footer->delete();

            Cache::forget("footers_lang_{$langId}");
            Cache::forget('admin_footers_' . md5(serialize(['lang_id' => $langId])));

            Log::add($request, 'Footer Deleted', 'delete', "Xóa footer: lang_id {$langId}");
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Xóa footer thành công'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            FacadesLog::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Xóa footer thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
}
