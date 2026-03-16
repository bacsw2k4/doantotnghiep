<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Log extends Model
{
    protected $table = 'logs'; // tên bảng

    protected $fillable = [
        'url',
        'ip',
        'infor',
        'author',
        'type',
        'desc',
    ];

    /**
     * Hàm tiện ích để thêm log nhanh
     */
    public static function add($request, $info, $type = 'info', $desc = null)
    {
        return self::create([
            'url'    => $request->fullUrl(),
            'ip'     => $request->ip(),
            'infor'  => $info,
            'author' => Auth::check() ? Auth::user()->name : 'guest',
            'type'   => $type,
            'desc'   => $desc,
        ]);
    }
}
