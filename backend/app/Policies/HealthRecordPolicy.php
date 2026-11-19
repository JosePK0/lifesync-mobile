<?php

namespace App\Policies;

use App\Models\HealthRecord;
use App\Models\User;

/** Mitigación IDOR: solo el dueño (auth uid) puede leer/editar/borrar. */
class HealthRecordPolicy
{
    public function manage(User $user, HealthRecord $record): bool
    {
        return $record->user_id === $user->id;
    }
}
