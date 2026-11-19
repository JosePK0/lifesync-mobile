<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    protected $fillable = ['latitude', 'longitude'];
    protected $hidden = ['user_id'];
}
