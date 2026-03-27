<?php

namespace App\Http\Controllers\Shopping;

use App\Http\Controllers\Controller;
use App\Models\Attribute;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $langId = $request->query('lang_id', 1);
        $categories = $request->query('categories');
        $category = $request->query('category');
        $sortBy = $request->query('sort_by', 'popular');
        $perPage = $request->query('per_page', 12);
        $search = $request->query('search');
        $priceMin = $request->query('price_min', 0);
        $priceMax = $request->query('price_max', 50000000);

        $query = Product::with(['categories', 'subProducts'])
            ->where('lang_id', $langId)
            ->where('status', 'active');

        if ($categories) {
            $categoryArray = array_map('trim', explode(',', $categories));
            $query->whereHas('categories', function ($q) use ($categoryArray) {
                $q->whereIn('categories.name', $categoryArray)
                    ->orWhereIn('categories.id', array_filter($categoryArray, 'is_numeric'));
            });
        } elseif ($category) {
            $query->whereHas('categories', function ($q) use ($category) {
                $q->where('categories.name', $category);
                if (is_numeric($category)) {
                    $q->orWhere('categories.id', $category);
                }
            });
        }

        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        if ($priceMin !== null) {
            $query->where('price', '>=', $priceMin);
        }
        if ($priceMax !== null) {
            $query->where('price', '<=', $priceMax);
        }

        switch ($sortBy) {
            case 'price-low':
                $query->orderBy('price', 'asc');
                break;
            case 'price-high':
                $query->orderBy('price', 'desc');
                break;
            case 'newest':
                $query->orderBy('created_at', 'desc');
                break;
            case 'popular':
            default:
                $query->orderBy('totalview', 'desc');
                break;
        }

        $bindings = $query->getBindings();
        $products = $query->paginate($perPage);
        $transformedProducts = $products->map(function ($product) {
            return $this->transformProduct($product);
        });

        return response()->json([
            'data' => $transformedProducts,
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
            'total' => $products->total(),
        ]);
    }

    public function getDualCategoryProducts(Request $request)
    {
        $langId = $request->query('lang_id', 1);
        $perPage = $request->query('per_page', 8);
        $categoryPages = $request->query('category_pages', []);

        $allCategories = Category::where('lang_id', $langId)
            ->where('status', 'active')
            ->orderBy('order', 'asc')
            ->take(8)
            ->get();

        if ($allCategories->count() < 2) {
            return response()->json([
                'data' => [],
                'categories' => [],
                'message' => 'Không đủ danh mục để hiển thị cặp sản phẩm.',
            ], 400);
        }

        $categoryPairs = $allCategories->chunk(2);
        $data = [];

        foreach ($categoryPairs as $pairIndex => $pairCategories) {
            $pairData = [];
            $pairCategoriesData = [];

            foreach ($pairCategories as $category) {
                $page = isset($categoryPages[$category->id]) ? (int) $categoryPages[$category->id] : 1;

                $productsQuery = Product::with(['categories', 'subProducts'])
                    ->where('lang_id', $langId)
                    ->where('status', 'active')
                    ->whereHas('categories', function ($q) use ($category) {
                        $q->where('category_id', $category->id);
                    })
                    ->orderBy('totalview', 'desc');

                $products = $productsQuery->paginate($perPage, ['*'], 'page', $page);

                $pairData[$category->name] = [
                    'products' => $products->map(function ($product) {
                        return $this->transformProduct($product);
                    })->toArray(),
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'total' => $products->total(),
                ];

                $pairCategoriesData[] = [
                    'id' => $category->id,
                    'name' => $category->name,
                ];
            }

            $data[] = [
                'categories' => $pairCategoriesData,
                'products' => $pairData,
            ];
        }

        return response()->json([
            'data' => $data,
            'total_pairs' => count($categoryPairs),
        ]);
    }

    // Trong ProductController.php
    public function recentlyViewed(Request $request)
    {
        $idsString = $request->query('ids');
        $langId = $request->query('lang_id', 1);

        if (!$idsString) {
            return response()->json(['data' => []]);
        }

        $productIds = array_filter(explode(',', $idsString), 'is_numeric');
        if (empty($productIds)) {
            return response()->json(['data' => []]);
        }

        $products = Product::with(['categories', 'subProducts'])
            ->where('lang_id', $langId)
            ->where('status', 'active')
            ->whereIn('id', $productIds)
            ->get();

        $products = $products->sortBy(function ($product) use ($productIds) {
            return array_search($product->id, $productIds);
        });

        $transformed = $products->map(function ($product) {
            return $this->transformProduct($product);
        });

        return response()->json([
            'data' => $transformed,
        ]);
    }

    private function transformProduct($product)
    {
        $badge = null;
        if ($product->saleprice && $product->price < $product->saleprice) {
            $badge = 'Sale';
        } elseif (now()->diffInDays($product->created_at) <= 7) {
            $badge = 'New';
        } elseif ($product->totalview > 1000) {
            $badge = 'Hot';
        }

        $discount = $product->saleprice && $product->price < $product->saleprice
            ? round((($product->saleprice - $product->price) / $product->saleprice) * 100)
            : null;

        $rating = $product->average_rating;
        $reviews = $product->total_reviews;

        $hoverImage = $product->subProducts->first()?->image
            ? asset('storage/' . $product->subProducts->first()->image)
            : asset('storage/' . $product->image);

        return [
            'id' => $product->id,
            'name' => $product->name,
            'price' => $product->saleprice,
            'originalPrice' => $product->price,
            'rating' => $rating,
            'url' => $product->url,
            'reviews' => $reviews,
            'image' => $product->image ? asset('storage/' . $product->image) : '/placeholder.svg',
            'hoverImage' => $hoverImage,
            'badge' => $badge,
            'discount' => $discount,
            'category' => $product->categories->first()?->name ?? 'unknown',
        ];
    }

    public function show($slug, Request $request)
    {
        $langId = $request->query('lang_id', 1);

        $product = Product::with([
            'categories',
            'subProducts',
            'approvedReviews'
        ])
            ->where('lang_id', $langId)
            ->where('status', 'active')
            ->where('url', $slug)
            ->firstOrFail();

        $badge = null;
        if ($product->saleprice && $product->price < $product->saleprice) {
            $badge = 'Sale';
        } elseif (now()->diffInDays($product->created_at) <= 7) {
            $badge = 'New';
        } elseif ($product->totalview > 1000) {
            $badge = 'Hot';
        }

        $discount = $product->saleprice && $product->price < $product->saleprice
            ? round((($product->saleprice - $product->price) / $product->saleprice) * 100)
            : null;

        $rating = $product->average_rating;
        $reviews = $product->total_reviews;
        $features = $product->params['features'] ?? [];
        $specifications = $product->params['specifications'] ?? [];
        $ratingDistribution = $product->rating_distribution;

        $images = [$product->image ? asset('storage/' . $product->image) : '/placeholder.svg'];
        $images = array_merge($images, $product->subProducts->map(fn($sub) => asset('storage/' . $sub->image))->toArray());

        $attributesData = json_decode($product->attribute, true);
        $parentAttributeIds = $attributesData['attribute_ids'] ?? [];

        $parentAttributes = Attribute::with(['children' => function ($query) use ($langId) {
            $query->where('lang_id', $langId)
                ->where('status', 'active')
                ->orderBy('order', 'asc');
        }])
            ->where('lang_id', $langId)
            ->where('status', 'active')
            ->whereIn('id', $parentAttributeIds)
            ->orderBy('order', 'asc')
            ->get();

        $groupedAttributes = $parentAttributes->map(function ($parent) {
            if ($parent->children->isEmpty()) {
                return null;
            }

            return [
                'parent_id' => $parent->id,
                'parent_name' => $parent->name,
                'type' => $parent->type,
                'options' => $parent->children->map(function ($child) {
                    $params = $child->params ? json_decode($child->params, true) : [];
                    $price = $params['price'] ?? 0;

                    return [
                        'value' => (string) $child->id,
                        'label' => $child->name,
                        'price' => (float) $price,
                        'color' => $child->color,
                        'image' => $child->image ? asset('storage/' . $child->image) : null,
                    ];
                })->toArray(),
            ];
        })->filter()->values()->toArray();

        return response()->json([
            'id' => $product->id,
            'name' => $product->name,
            'price' => (float) $product->price,
            'originalPrice' => $product->saleprice ? (float) $product->saleprice : null,
            'rating' => $rating,
            'reviews' => $reviews,
            'rating_distribution' => $ratingDistribution,
            'images' => $images,
            'description' => $product->desc,
            'content' => $product->content,
            'features' => $features,
            'specifications' => $specifications,
            'attributes' => $groupedAttributes,
            'category_id' => $product->categories->first()?->id,
            'category_name' => $product->categories->first()?->name,
        ]);
    }

    public function getCategory(Request $request)
    {
        $langId = $request->query('lang_id', 1);

        $categories = Category::where('lang_id', $langId)
            ->where('status', 'active')
            ->orderBy('order', 'asc')
            ->get(['id', 'name']);

        if ($categories->isEmpty()) {
            return response()->json([
                'data' => [],
                'message' => 'Không tìm thấy danh mục nào.',
            ], 200);
        }

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function getRelatedProducts($id, Request $request)
    {
        $langId = $request->query('lang_id', 1);
        $limit = $request->query('limit', 4);

        $currentProduct = Product::with('categories')
            ->where('lang_id', $langId)
            ->where('status', 'active')
            ->findOrFail($id);

        $categoryIds = $currentProduct->categories->pluck('id')->toArray();

        if (empty($categoryIds)) {
            return response()->json(['data' => []]);
        }

        $relatedProducts = Product::with(['categories', 'subProducts'])
            ->where('lang_id', $langId)
            ->where('status', 'active')
            ->where('id', '!=', $id)
            ->whereHas('categories', function ($query) use ($categoryIds) {
                $query->whereIn('category_id', $categoryIds);
            })
            ->orderBy('totalview', 'desc')
            ->take($limit)
            ->get();

        if ($relatedProducts->count() < $limit) {
            $remaining = $limit - $relatedProducts->count();
            $additionalProducts = Product::with(['categories', 'subProducts'])
                ->where('lang_id', $langId)
                ->where('status', 'active')
                ->where('id', '!=', $id)
                ->whereNotIn('id', $relatedProducts->pluck('id'))
                ->orderBy('created_at', 'desc')
                ->take($remaining)
                ->get();

            $relatedProducts = $relatedProducts->merge($additionalProducts);
        }

        $transformedProducts = $relatedProducts->map(function ($product) {
            return $this->transformProduct($product);
        });

        return response()->json([
            'data' => $transformedProducts,
            'total' => $relatedProducts->count(),
        ]);
    }
}
