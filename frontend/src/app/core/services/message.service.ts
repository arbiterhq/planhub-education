import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Message, MessageContact } from '../../shared/models/message.model';

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

  searchUsers(search: string): Observable<{ id: number; name: string; company: string }[]> {
    return this.http.get<{ data: { id: number; name: string; company: string }[] }>(
      '/api/messages/users', { params: { search } }
    ).pipe(map(r => r.data));
  }
}
