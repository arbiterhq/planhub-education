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
