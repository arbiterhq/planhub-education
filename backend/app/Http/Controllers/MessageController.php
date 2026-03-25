<?php

namespace App\Http\Controllers;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function inbox(Request $request)
    {
        $query = Message::where('recipient_id', auth()->id())
            ->with(['sender.company', 'recipient.company', 'project'])
            ->orderBy('created_at', 'desc');

        if ($request->boolean('unread_only')) {
            $query->whereNull('read_at');
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        return MessageResource::collection($query->paginate(20));
    }

    public function sent(Request $request)
    {
        $messages = Message::where('sender_id', auth()->id())
            ->with(['sender.company', 'recipient.company', 'project'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return MessageResource::collection($messages);
    }

    public function thread(Request $request, User $user)
    {
        $me = auth()->id();
        $userId = $user->id;

        $messages = Message::where(function ($q) use ($me, $userId) {
            $q->where(fn($q2) => $q2->where('sender_id', $me)->where('recipient_id', $userId))
              ->orWhere(fn($q2) => $q2->where('sender_id', $userId)->where('recipient_id', $me));
        })
            ->with(['sender.company', 'recipient.company', 'project'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark unread messages from the other user as read
        Message::where('sender_id', $userId)
            ->where('recipient_id', $me)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return MessageResource::collection($messages);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'project_id' => 'nullable|exists:projects,id',
        ]);

        $message = Message::create([
            ...$validated,
            'sender_id' => auth()->id(),
        ]);

        $message->load(['sender.company', 'recipient.company', 'project']);

        ActivityLogger::log(
            'message_sent',
            "Sent message to {$message->recipient->name}: \"{$message->subject}\"",
            $message->project_id
        );

        return (new MessageResource($message))->response()->setStatusCode(201);
    }

    public function markRead(Request $request, Message $message)
    {
        if ($message->recipient_id !== auth()->id()) {
            abort(403, 'You are not the recipient of this message.');
        }

        if ($message->read_at === null) {
            $message->update(['read_at' => now()]);
        }

        $message->load(['sender.company', 'recipient.company', 'project']);

        return new MessageResource($message);
    }

    public function unreadCount(Request $request)
    {
        $count = Message::where('recipient_id', auth()->id())
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    public function searchUsers(Request $request)
    {
        $search = $request->get('search', '');
        $me = auth()->id();

        $users = User::where('id', '!=', $me)
            ->with('company')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhereHas('company', fn($q) => $q->where('name', 'like', '%' . $search . '%'));
                });
            })
            ->limit(20)
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'company' => $u->company?->name,
            ]);

        return response()->json(['data' => $users]);
    }

    public function contacts(Request $request)
    {
        $me = auth()->id();

        // Get all users this user has exchanged messages with
        $contactIds = Message::where('sender_id', $me)
            ->orWhere('recipient_id', $me)
            ->get()
            ->map(fn($m) => $m->sender_id === $me ? $m->recipient_id : $m->sender_id)
            ->unique()
            ->values();

        $contacts = User::whereIn('id', $contactIds)
            ->with('company')
            ->get()
            ->map(function ($user) use ($me) {
                // Latest message between me and this user
                $latest = Message::where(function ($q) use ($me, $user) {
                    $q->where(fn($q2) => $q2->where('sender_id', $me)->where('recipient_id', $user->id))
                      ->orWhere(fn($q2) => $q2->where('sender_id', $user->id)->where('recipient_id', $me));
                })
                    ->orderBy('created_at', 'desc')
                    ->first();

                // Unread count from this contact
                $unreadCount = Message::where('sender_id', $user->id)
                    ->where('recipient_id', $me)
                    ->whereNull('read_at')
                    ->count();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'company' => $user->company?->name,
                    'latest_message' => $latest ? mb_substr($latest->body, 0, 100) : '',
                    'latest_message_at' => $latest?->created_at,
                    'unread_count' => $unreadCount,
                ];
            })
            ->sortByDesc('latest_message_at')
            ->values();

        return response()->json(['data' => $contacts]);
    }
}
