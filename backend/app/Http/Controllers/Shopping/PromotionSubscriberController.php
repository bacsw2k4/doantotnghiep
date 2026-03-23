<?php

namespace App\Http\Controllers\Shopping;

use App\Http\Controllers\Controller;
use App\Models\PromotionSubscriber;
use Illuminate\Http\Request;

class PromotionSubscriberController extends Controller
{
    public function subscribe(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $subscriber = PromotionSubscriber::where('email', $request->email)->first();

        if ($subscriber) {
            if (!$subscriber->status) {
                $subscriber->update([
                    'status' => true,
                    'subscribed_at' => now(),
                ]);
            }

            return response()->json([
                'message' => 'Email đã được đăng ký'
            ], 200);
        }

        PromotionSubscriber::create([
            'email' => $request->email,
            'status' => true,
            'subscribed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Đăng ký nhận khuyến mãi thành công'
        ], 201);
    }
}
