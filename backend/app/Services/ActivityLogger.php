<?php

namespace App\Services;

use App\Models\ActivityLog;

class ActivityLogger
{
    public static function log(
        string $action,
        string $description,
        ?int $projectId = null,
        ?array $metadata = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id'     => auth()->id(),
            'company_id'  => auth()->user()?->company_id,
            'project_id'  => $projectId,
            'action'      => $action,
            'description' => $description,
            'metadata'    => $metadata,
        ]);
    }
}
