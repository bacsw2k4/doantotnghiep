<?php

namespace App\Http\Controllers\Shopping;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\Menu\MenuResource;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        $langId = $request->query('lang_id', 1);
        $cacheKey = "menus_lang_{$langId}";
        $menus = Cache::remember($cacheKey, now()->addMinutes(60), function () use ($langId) {
            return Menu::with('children')
                ->active()
                ->byLanguage($langId)
                ->whereNull('parentid')
                ->orderBy('order')
                ->get();
        });

        return MenuResource::collection($menus);
    }
}
