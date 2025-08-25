<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $fillable = ['name', 'email', 'password', 'role'];

    protected $hidden = ['password'];

    protected $casts = [
        'password' => 'hashed', // auto-hash saat set
    ];
}
