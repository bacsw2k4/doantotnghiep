<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attribute extends Model
{
    use HasFactory;
    protected $fillable = [
        'lang_id',
        'parentid',
        'name',
        'type',
        'color',
        'image',
        'order',
        'status',
    ];

    public $timestamps = false;

    public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id');
    }

    public function children()
    {
        return $this->hasMany(Attribute::class, 'parentid', 'id')->with('children')->orderBy('order');
    }

    public function parent()
    {
        return $this->belongsTo(Attribute::class, 'parentid');
    }
}
