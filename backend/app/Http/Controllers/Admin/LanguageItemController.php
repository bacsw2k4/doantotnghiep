<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LanguageItem;
use Illuminate\Http\Request;

class LanguageItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $languageId = $request->query('language_id') ?? auth()->user()->language_id ?? 1;
        $items = LanguageItem::where('language_id', $languageId)
            ->with(['language', 'languageKey'])
            ->get();

        return response()->json(['success' => true, 'data' => $items]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.language_key_id' => 'required|integer|exists:language_keys,id',
            'items.*.title'           => 'required|string|max:255',
            'items.*.desc'            => 'nullable|string',
            'items.*.status'          => 'required|in:active,inactive',
        ]);

        $items = $validated['items'];
        $languageId = $request->query('language_id') ?? auth()->user()->language_id ?? 1;

        // Kiểm tra trùng language_key_id trong cùng language_id
        $keyIds = collect($items)->pluck('language_key_id');
        $duplicatesInRequest = $keyIds->duplicates();
        if ($duplicatesInRequest->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Có key bị trùng trong danh sách thêm mới'
            ], 422);
        }

        $existing = LanguageItem::where('language_id', $languageId)
            ->whereIn('language_key_id', $keyIds)
            ->exists();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Một số key đã tồn tại trong ngôn ngữ này'
            ], 422);
        }

        $data = collect($items)->map(fn($item) => [
            'language_id'      => $languageId,
            'language_key_id'  => $item['language_key_id'],
            'title'            => trim($item['title']),
            'desc'             => $item['desc'] ?? null,
            'status'           => $item['status'],
            'created_at'       => now(),
            'updated_at'       => now(),
        ])->all();

        LanguageItem::insert($data);

        return response()->json([
            'success' => true,
            'message' => 'Tạo thành công ' . count($data) . ' bản dịch'
        ], 201);
    }



    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id'              => 'required|integer|exists:language_items,id',
            'items.*.title'           => 'required|string|max:255',
            'items.*.desc'            => 'nullable|string',
            'items.*.status'          => 'required|in:active,inactive',
            'items.*.language_key_id' => 'sometimes|integer|exists:language_keys,id',
        ]);

        $items = $validated['items'];

        // Kiểm tra trùng key trong danh sách đang sửa (trừ chính nó)
        $keyMap = [];
        foreach ($items as $item) {
            if (!isset($item['language_key_id'])) continue;
            $keyId = $item['language_key_id'];
            $currentId = $item['id'];
            if (isset($keyMap[$keyId]) && $keyMap[$keyId] !== $currentId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể gán cùng một key cho 2 bản ghi'
                ], 422);
            }
            $keyMap[$keyId] = $currentId;
        }

        // Kiểm tra xung đột với bản ghi ngoài danh sách
        $changingKeyItems = collect($items)->filter(fn($i) => isset($i['language_key_id']));
        if ($changingKeyItems->isNotEmpty()) {
            $keyIds = $changingKeyItems->pluck('language_key_id');
            $currentIds = $changingKeyItems->pluck('id')->toArray();

            $conflict = LanguageItem::whereIn('language_key_id', $keyIds)
                ->whereNotIn('id', $currentIds)
                ->exists();

            if ($conflict) {
                return response()->json([
                    'success' => false,
                    'message' => 'Một số key đã được dùng ở bản ghi khác'
                ], 422);
            }
        }

        foreach ($items as $item) {
            $updateData = [
                'title'   => trim($item['title']),
                'desc'    => $item['desc'] ?? null,
                'status'  => $item['status'],
            ];
            if (isset($item['language_key_id'])) {
                $updateData['language_key_id'] = $item['language_key_id'];
            }

            LanguageItem::where('id', $item['id'])->update($updateData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thành công ' . count($items) . ' bản dịch'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LanguageItem $languageItem)
    {
        $languageItem->delete();
        return response()->json(['success' => true, 'message' => 'Xóa thành công']);
    }
    public function deleteMultiple(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:language_items,id'
        ]);

        LanguageItem::whereIn('id', $request->ids)->delete();
        return response()->json(['success' => true, 'message' => 'Xóa nhiều thành công']);
    }
}