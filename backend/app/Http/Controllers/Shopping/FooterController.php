<?php

namespace App\Http\Controllers\Shopping;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\Footer\FooterResource;
use App\Models\Footer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class FooterController extends Controller
{
    public function index(Request $request)
    {
        $langId = $request->query('lang_id', 1);
        $cacheKey = "footers_lang_{$langId}";
        $footer = Cache::remember($cacheKey, now()->addMinutes(60), function () use ($langId) {
            return Footer::active()
                ->byLanguage($langId)
                ->orderBy('order')
                ->first();
        });

        return new FooterResource($footer);
    }
}
