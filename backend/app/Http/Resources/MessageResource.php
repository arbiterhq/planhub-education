<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'sender_id' => $this->sender_id,
            'recipient_id' => $this->recipient_id,
            'project_id' => $this->project_id,
            'subject' => $this->subject,
            'body' => $this->body,
            'read_at' => $this->read_at,
            'is_read' => $this->read_at !== null,
            'sender' => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'company' => $this->sender->company?->name,
            ],
            'recipient' => [
                'id' => $this->recipient->id,
                'name' => $this->recipient->name,
                'company' => $this->recipient->company?->name,
            ],
            'project' => $this->when($this->project_id, fn() => [
                'id' => $this->project?->id,
                'name' => $this->project?->name,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
