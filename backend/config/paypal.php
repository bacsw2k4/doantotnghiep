<?php
// config/paypal.php
return [
    'mode' => env('PAYPAL_MODE', 'sandbox'),

    'sandbox' => [
        'client_id' => env('PAYPAL_SANDBOX_CLIENT_ID', ''),
        'client_secret' => env('PAYPAL_SANDBOX_CLIENT_SECRET', ''),
        'app_id' => env('PAYPAL_SANDBOX_APP_ID', 'APP-80W284485P519543T'),
    ],

    'live' => [
        'client_id' => env('PAYPAL_LIVE_CLIENT_ID', ''),
        'client_secret' => env('PAYPAL_LIVE_CLIENT_SECRET', ''),
        'app_id' => env('PAYPAL_LIVE_APP_ID', ''),
    ],

    'payment_action' => 'Sale',
    'currency' => env('PAYPAL_CURRENCY', 'USD'),
    'notify_url' => env('PAYPAL_NOTIFY_URL', ''),
    'locale' => 'en_US',
    'validate_ssl' => true,
    'log_enabled' => env('PAYPAL_LOG_ENABLED', true),
    'log_level' => env('PAYPAL_LOG_LEVEL', 'INFO'),
];
