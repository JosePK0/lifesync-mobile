<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealthRecord extends Model
{
    use HasFactory;

    public const TYPES = ['blood_type', 'allergy', 'medication', 'contact'];

    protected $fillable = ['type', 'title', 'details', 'phone', 'dosage', 'remind_at', 'critical', 'image_path'];
    protected $hidden = ['user_id'];

    protected function casts(): array
    {
        return ['critical' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
