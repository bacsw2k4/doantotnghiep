<?php

namespace App\Http\Controllers\Shopping;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\Banner\BannerResource;
use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BannerController extends Controller
{
    public function index(Request $request)
    {
        $langId = $request->query('lang_id', 1);
        $cacheKey = "banners_lang_{$langId}";
        $banners = Cache::remember($cacheKey, now()->addMinutes(60), function () use ($langId) {
            return Banner::active()
                ->byLanguage($langId)
                ->orderBy('order')
                ->get();
        });
        return BannerResource::collection($banners);
    }
}
