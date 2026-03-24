# Task 12 — Messages (Full Stack)

## Objective

Build a simple messaging system: Laravel API for sending/receiving messages between the GC and subcontractor users, and an Angular two-panel messaging UI with a conversation list, message thread view, and compose functionality.

## Prerequisites

- Task 03 complete (Database with message data)
- Task 04 complete (Authentication)
- Task 05 complete (App shell and navigation)

## Steps

### Backend

#### 1. Create MessageResource

Create `backend/app/Http/Resources/MessageResource.php`:

```php
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
```

#### 2. Create MessageController

Create `backend/app/Http/Controllers/MessageController.php`:

##### `inbox` — `GET /api/messages`

- Get messages where `recipient_id = auth()->id()`
- Optional filter: `unread_only=true` → `whereNull('read_at')`
- Optional filter: `project_id` → filter by project
- Eager load: `sender.company`, `recipient.company`, `project`
- Order by `created_at` descending
- Paginate: 20 per page

##### `sent` — `GET /api/messages/sent`

- Get messages where `sender_id = auth()->id()`
- Same eager loads and ordering
- Paginate: 20 per page

##### `thread` — `GET /api/messages/thread/{userId}`

- Get all messages between the authenticated user and the specified user (both directions)
- `where(fn($q) => $q->where(['sender_id' => $me, 'recipient_id' => $userId])->orWhere(['sender_id' => $userId, 'recipient_id' => $me]))`
- Order by `created_at` ascending (chronological)
- Mark all unread messages from the other user as read: set `read_at = now()`
- No pagination (load full thread for simplicity in this demo)

##### `store` — `POST /api/messages`

- Validate:
  ```php
  'recipient_id' => 'required|exists:users,id',
  'subject' => 'required|string|max:255',
  'body' => 'required|string',
  'project_id' => 'nullable|exists:projects,id',
  ```
- Create message with `sender_id = auth()->id()`
- Return `new MessageResource($message)` with 201

##### `markRead` — `PUT /api/messages/{message}/read`

- Verify the authenticated user is the recipient
- Set `read_at = now()` if not already read
- Return updated message

##### `unreadCount` — `GET /api/messages/unread-count`

- Return: `{ count: N }` where N is unread messages for the authenticated user

##### `contacts` — `GET /api/messages/contacts`

- Return a list of users the authenticated user has exchanged messages with
- For each contact, include:
  - User id, name, company name
  - Latest message preview (truncated body, 100 chars)
  - Latest message timestamp
  - Unread message count from this contact
- Order by latest message timestamp descending

#### 3. Register routes

In `routes/api.php` inside `auth:sanctum` group:

```php
Route::get('messages', [MessageController::class, 'inbox']);
Route::get('messages/sent', [MessageController::class, 'sent']);
Route::get('messages/unread-count', [MessageController::class, 'unreadCount']);
Route::get('messages/contacts', [MessageController::class, 'contacts']);
Route::get('messages/thread/{user}', [MessageController::class, 'thread']);
Route::post('messages', [MessageController::class, 'store']);
Route::put('messages/{message}/read', [MessageController::class, 'markRead']);
```

**Important:** Named routes (`unread-count`, `contacts`, `sent`) must come before the `{message}` wildcard.

### Frontend

#### 4. Create MessageService

Create `frontend/src/app/core/services/message.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class MessageService {
  private http = inject(HttpClient);

  getContacts(): Observable<MessageContact[]> {
    return this.http.get<{ data: MessageContact[] }>('/api/messages/contacts').pipe(map(r => r.data));
  }

  getThread(userId: number): Observable<Message[]> {
    return this.http.get<{ data: Message[] }>(`/api/messages/thread/${userId}`).pipe(map(r => r.data));
  }

  sendMessage(data: { recipient_id: number; subject: string; body: string; project_id?: number }): Observable<{ data: Message }> {
    return this.http.post<{ data: Message }>('/api/messages', data);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>('/api/messages/unread-count');
  }
}
```

Create models in `frontend/src/app/shared/models/message.model.ts`:

```typescript
export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  project_id: number | null;
  subject: string;
  body: string;
  read_at: string | null;
  is_read: boolean;
  sender: { id: number; name: string; company: string };
  recipient: { id: number; name: string; company: string };
  project?: { id: number; name: string };
  created_at: string;
}

export interface MessageContact {
  id: number;
  name: string;
  company: string;
  latest_message: string;
  latest_message_at: string;
  unread_count: number;
}
```

#### 5. Build the messages page

Replace `frontend/src/app/features/messages/message-list/message-list.component.ts`:

Two-panel layout using CSS Grid or Flexbox:

##### Left Panel — Conversation List (300px width)
- "New Message" button at the top
- Search input to filter contacts
- Scrollable list of contacts (`mat-nav-list`):
  - Each item shows:
    - Contact name (bold if unread messages)
    - Company name (smaller, gray)
    - Latest message preview (truncated, 1 line)
    - Timestamp (relative: "2h ago", "Yesterday", "Mar 15")
    - Unread count badge (`mat-badge` on the list item if > 0)
  - Clicking a contact loads their thread in the right panel
  - Active contact highlighted

##### Right Panel — Message Thread (remaining width)
- **If no contact selected**: Show a centered placeholder: "Select a conversation to start messaging"
- **If contact selected**:
  - Header: Contact name + company name
  - Scrollable message thread:
    - Messages displayed as chat bubbles
    - Sent messages (from the GC user): right-aligned, primary color background
    - Received messages: left-aligned, gray background
    - Each bubble shows: body text, timestamp below
    - If message has a project reference, show it as a small link/chip above the message
    - Auto-scroll to the bottom on load and when new message is sent
  - Compose area at bottom:
    - Subject field (small, above the body — only shown for new conversations or can be auto-filled)
    - `mat-form-field` with textarea for message body
    - Optional: project reference select (`mat-select` with projects)
    - "Send" `mat-icon-button` (send icon)
    - Send on Enter (Shift+Enter for newline)

##### "New Message" dialog
Create `frontend/src/app/features/messages/compose-dialog/compose-dialog.component.ts`:

A `mat-dialog` with:
- **Recipient**: Autocomplete (`mat-autocomplete`) searching subcontractor users by name or company
- **Subject**: text input (required)
- **Project** (optional): select from projects
- **Body**: textarea (required)
- "Send" button → calls `MessageService.sendMessage()`
- On success: close dialog, refresh contacts list, open the new thread

#### 6. Add unread badge to sidebar

Update the layout component (from Task 05) to show an unread message count badge on the "Messages" nav item:
- Poll `MessageService.getUnreadCount()` every 30 seconds (use `interval` from rxjs)
- Display as `mat-badge` on the Messages `mat-list-item`
- Clear/update when messages are read

#### 7. Responsive behavior

On mobile (< 768px):
- Show only the contact list by default
- Clicking a contact replaces the list with the thread view
- Back button on the thread view returns to the contact list

### 8. Verify

1. Navigate to `/messages` — see two-panel layout
2. Contact list shows seeded conversations
3. Click a contact — thread loads with messages in chronological order
4. Messages appear as chat bubbles (sent = right, received = left)
5. Type a message and send — appears in the thread immediately
6. "New Message" dialog allows selecting a recipient and sending
7. Unread count badge appears on sidebar Messages item
8. Opening a thread marks messages as read
9. Project references appear as links on relevant messages
10. Layout is responsive on mobile

## Files Created/Modified

### Backend
- `backend/app/Http/Controllers/MessageController.php`
- `backend/app/Http/Resources/MessageResource.php`
- `backend/routes/api.php` — Message routes added

### Frontend
- `frontend/src/app/shared/models/message.model.ts`
- `frontend/src/app/core/services/message.service.ts`
- `frontend/src/app/features/messages/message-list/message-list.component.ts` — Full rewrite
- `frontend/src/app/features/messages/compose-dialog/compose-dialog.component.ts` — New
- `frontend/src/app/core/layout/layout.component.ts` — Updated with unread badge

## Acceptance Criteria

1. `GET /api/messages/contacts` returns contacts sorted by latest message
2. `GET /api/messages/thread/{userId}` returns chronological messages and marks them read
3. `POST /api/messages` sends a message
4. `GET /api/messages/unread-count` returns correct count
5. Two-panel layout displays correctly on desktop
6. Chat bubbles align correctly (sent right, received left)
7. Sending a message updates the thread in real-time (no page refresh)
8. "New Message" dialog works with recipient autocomplete
9. Unread badge shows on sidebar and updates when messages are read
10. Mobile layout shows single panel at a time
