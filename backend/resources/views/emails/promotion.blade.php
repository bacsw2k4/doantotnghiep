{{-- resources/views/emails/promotion.blade.php --}}
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $subject }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: #4F46E5;
            color: white;
            padding: 20px;
            text-align: center;
        }

        .content {
            padding: 30px;
            background: #f9f9f9;
        }

        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
        }

        .unsubscribe {
            color: #666;
            font-size: 12px;
            margin-top: 30px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>Khuyến Mãi Đặc Biệt</h1>
        </div>

        <div class="content">
            {!! nl2br(e($content)) !!}
        </div>

        <div class="unsubscribe">
            <p>Để ngừng nhận email khuyến mãi, vui lòng cập nhật cài đặt trong tài khoản của bạn.</p>
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>

</html>