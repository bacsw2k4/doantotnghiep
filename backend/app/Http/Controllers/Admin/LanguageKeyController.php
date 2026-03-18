<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LanguageKey;
use Illuminate\Http\Request;

class LanguageKeyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $languageKeys = LanguageKey::all();
        return response()->json(['success' => true, 'data' => $languageKeys]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!$request->has('keys') || !is_array($request->keys)) {
            return response()->json([
                'success' => false,
                'message' => 'keys không hợp lệ'
            ], 400);
        }

        $validated = $request->validate([
            'keys' => 'required|array|min:1',
            'keys.*.title' => 'required|string|max:255|unique:language_keys,title',
            'keys.*.desc'  => 'nullable|string',
        ]);

        $keys = $validated['keys'];

        $titles = collect($keys)->pluck('title');
        $duplicates = $titles->duplicates();

        if ($duplicates->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Title trùng trong danh sách: ' . $duplicates->unique()->implode(', ')
            ], 422);
        }

        $data = array_map(fn($k) => [
            'title' => trim($k['title']),
            'desc'  => $k['desc'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ], $keys);

        LanguageKey::insert($data);

        return response()->json([
            'success' => true,
            'message' => 'Tạo thành công ' . count($data) . ' key'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(LanguageKey $languageKey)
    {
        return response()->json(['success' => true, 'data' => $languageKey]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        if (!$request->has('keys') || !is_array($request->keys)) {
            return response()->json([
                'success' => false,
                'message' => 'keys không hợp lệ'
            ], 400);
        }

        $request->validate([
            'keys' => 'required|array|min:1',
            'keys.*.id'    => 'required|integer|exists:language_keys,id',
            'keys.*.title' => 'required|string|max:255',
            'keys.*.desc'  => 'nullable|string',
        ]);

        $keys = $request->keys;

        // ❗ Check trùng trong request
        $titleToId = [];
        foreach ($keys as $item) {
            $title = strtolower(trim($item['title']));
            if (isset($titleToId[$title]) && $titleToId[$title] !== $item['id']) {
                return response()->json([
                    'success' => false,
                    'message' => "Title '{$item['title']}' bị trùng trong danh sách"
                ], 422);
            }
            $titleToId[$title] = $item['id'];
        }

        // ❗ Check trùng DB
        $titles = collect($keys)->pluck('title')->map('trim');
        $ids    = collect($keys)->pluck('id')->toArray();

        $conflict = LanguageKey::whereIn('title', $titles)
            ->whereNotIn('id', $ids)
            ->exists();

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'Một số title đã tồn tại trong hệ thống'
            ], 422);
        }

        // 🔄 Update
        foreach ($keys as $item) {
            LanguageKey::where('id', $item['id'])->update([
                'title' => trim($item['title']),
                'desc'  => $item['desc'] ?? null,
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thành công ' . count($keys) . ' bản ghi'
        ]);
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LanguageKey $languageKey)
    {
        $languageKey->delete();
        return response()->json(['success' => true, 'message' => 'Xóa thành công']);
    }
    public function deleteMultiple(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:language_keys,id',
        ]);

        LanguageKey::whereIn('id', $validated['ids'])->delete();

        return response()->json(['success' => true, 'message' => 'Xóa nhiều thành công']);
    }
}