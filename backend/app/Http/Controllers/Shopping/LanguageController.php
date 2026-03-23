<?php

namespace App\Http\Controllers\Shopping;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\Language\LanguageResource;
use App\Models\Language;
use App\Models\LanguageItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LanguageController extends Controller
{
    public function index()
    {
        $cacheKey = 'languages_active';
        $languages = Cache::remember($cacheKey, now()->addMinutes(60), function () {
            return Language::where('status', 'active')
                ->orderBy('order', 'asc')
                ->get();
        });

        return LanguageResource::collection($languages);
    }

    public function get(Request $request)
    {
        $languageId = $request->query('language_id', auth()->user()->language_id ?? 1);
        $languageItems = LanguageItem::where('language_id', $languageId)
            ->with(['language', 'languageKey'])
            ->get();
        return response()->json(['success' => true, 'data' => $languageItems]);
    }
}
