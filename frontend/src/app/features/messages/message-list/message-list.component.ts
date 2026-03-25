import {
  Component,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessageService } from '../../../core/services/message.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Message, MessageContact } from '../../../shared/models/message.model';
import { ComposeDialogComponent } from '../compose-dialog/compose-dialog.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="messages-layout" [class.mobile-thread-open]="mobileThreadOpen()">

      <!-- Left Panel: Contact List -->
      <div class="contacts-panel" [class.hidden-mobile]="mobileThreadOpen()">
        <div class="contacts-header">
          <h2 class="panel-title">Messages</h2>
          <button mat-raised-button color="primary" (click)="openCompose()">
            <mat-icon>edit</mat-icon> New
          </button>
        </div>

        <div class="search-container">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput placeholder="Search contacts..." [formControl]="searchControl" />
          </mat-form-field>
        </div>

        <mat-nav-list class="contacts-list">
          @if (loading()) {
            <div class="empty-state">Loading...</div>
          } @else if (filteredContacts().length === 0) {
            <div class="empty-state">No conversations yet</div>
          } @else {
            @for (contact of filteredContacts(); track contact.id) {
              <a mat-list-item
                 class="contact-item"
                 [class.active]="selectedContact()?.id === contact.id"
                 (click)="selectContact(contact)">
                <div class="contact-row">
                  <div class="contact-info">
                    <span class="contact-name" [class.unread]="contact.unread_count > 0">
                      {{ contact.name }}
                    </span>
                    <span class="contact-company">{{ contact.company }}</span>
                    <span class="contact-preview">{{ contact.latest_message }}</span>
                  </div>
                  <div class="contact-meta">
                    <span class="contact-time">{{ formatTime(contact.latest_message_at) }}</span>
                    @if (contact.unread_count > 0) {
                      <span class="unread-badge">{{ contact.unread_count }}</span>
                    }
                  </div>
                </div>
              </a>
            }
          }
        </mat-nav-list>
      </div>

      <!-- Right Panel: Thread View -->
      <div class="thread-panel" [class.hidden-mobile]="!mobileThreadOpen() && isMobile()">

        @if (!selectedContact()) {
          <div class="empty-thread">
            <mat-icon class="empty-icon">forum</mat-icon>
            <p>Select a conversation to start messaging</p>
          </div>
        } @else {
          <div class="thread-header">
            @if (isMobile()) {
              <button mat-icon-button (click)="closeThread()">
                <mat-icon>arrow_back</mat-icon>
              </button>
            }
            <div class="thread-contact-info">
              <span class="thread-contact-name">{{ selectedContact()!.name }}</span>
              <span class="thread-contact-company">{{ selectedContact()!.company }}</span>
            </div>
          </div>

          <div class="thread-messages" #messageContainer>
            @if (threadLoading()) {
              <div class="empty-state">Loading messages...</div>
            } @else if (thread().length === 0) {
              <div class="empty-state">No messages yet. Send the first one!</div>
            } @else {
              @for (msg of thread(); track msg.id) {
                <div class="message-wrapper" [class.sent]="msg.sender_id === currentUserId()">
                  @if (msg.project) {
                    <a class="message-project-ref" [class.sent]="msg.sender_id === currentUserId()"
                       [routerLink]="'/projects/' + msg.project.id">
                      <mat-icon style="font-size:14px;width:14px;height:14px">business</mat-icon>
                      {{ msg.project.name }}
                    </a>
                  }
                  <div class="message-bubble" [class.sent]="msg.sender_id === currentUserId()">
                    <div class="message-body">{{ msg.body }}</div>
                    <div class="message-time">{{ formatMessageTime(msg.created_at) }}</div>
                  </div>
                </div>
              }
            }
          </div>

          <div class="compose-area">
            <mat-form-field appearance="outline" class="subject-field">
              <mat-label>Subject</mat-label>
              <input matInput [formControl]="subjectControl" />
            </mat-form-field>

            <div class="compose-row">
              <mat-form-field appearance="outline" class="body-field">
                <mat-label>Message</mat-label>
                <textarea matInput
                          [formControl]="bodyControl"
                          rows="3"
                          (keydown.enter)="onEnterKey($event)">
                </textarea>
              </mat-form-field>
              <button mat-icon-button color="primary" class="send-button"
                      [disabled]="!bodyControl.value?.trim()"
                      (click)="sendMessage()"
                      matTooltip="Send (Enter)">
                <mat-icon>send</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: calc(100vh - 64px - 48px);
    }

    .messages-layout {
      display: flex;
      height: 100%;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 8px;
      overflow: hidden;
      background: white;
    }

    /* Left Panel */
    .contacts-panel {
      width: 300px;
      min-width: 300px;
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(0,0,0,0.12);
    }

    .contacts-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }

    .panel-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .search-container {
      padding: 8px 12px 0;
    }

    .search-field {
      width: 100%;
    }

    .search-field .mat-mdc-form-field-infix {
      min-height: 40px;
    }

    .contacts-list {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .contact-item {
      height: auto !important;
      min-height: 72px;
      padding: 8px 16px !important;
      cursor: pointer;
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }

    .contact-item.active {
      background-color: rgba(21, 101, 192, 0.08) !important;
    }

    .contact-item:hover:not(.active) {
      background-color: rgba(0,0,0,0.03);
    }

    .contact-row {
      display: flex;
      width: 100%;
      gap: 8px;
      align-items: flex-start;
    }

    .contact-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .contact-name {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .contact-name.unread {
      font-weight: 700;
    }

    .contact-company {
      font-size: 12px;
      color: rgba(0,0,0,0.54);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .contact-preview {
      font-size: 12px;
      color: rgba(0,0,0,0.45);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    .contact-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }

    .contact-time {
      font-size: 11px;
      color: rgba(0,0,0,0.45);
      white-space: nowrap;
    }

    .unread-badge {
      background-color: #1565C0;
      color: white;
      border-radius: 10px;
      padding: 1px 6px;
      font-size: 11px;
      font-weight: 600;
      min-width: 18px;
      text-align: center;
    }

    .empty-state {
      padding: 32px 16px;
      text-align: center;
      color: rgba(0,0,0,0.45);
      font-size: 14px;
    }

    /* Right Panel */
    .thread-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .empty-thread {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(0,0,0,0.38);
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .thread-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(0,0,0,0.12);
      gap: 8px;
    }

    .thread-contact-info {
      display: flex;
      flex-direction: column;
    }

    .thread-contact-name {
      font-size: 15px;
      font-weight: 600;
    }

    .thread-contact-company {
      font-size: 12px;
      color: rgba(0,0,0,0.54);
    }

    .thread-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .message-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      max-width: 70%;
    }

    .message-wrapper.sent {
      align-self: flex-end;
      align-items: flex-end;
    }

    .message-project-ref {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #1976d2;
      margin-bottom: 2px;
      padding: 2px 8px;
      background: rgba(25,118,210,0.08);
      border-radius: 4px;
      text-decoration: none;
      cursor: pointer;
    }
    .message-project-ref:hover { text-decoration: underline; }

    .message-bubble {
      background-color: #f0f0f0;
      border-radius: 12px 12px 12px 2px;
      padding: 8px 12px;
      max-width: 100%;
    }

    .message-bubble.sent {
      background-color: #1565C0;
      color: white;
      border-radius: 12px 12px 2px 12px;
    }

    .message-body {
      font-size: 14px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .message-time {
      font-size: 11px;
      opacity: 0.65;
      margin-top: 4px;
      text-align: right;
    }

    /* Compose Area */
    .compose-area {
      padding: 12px 16px;
      border-top: 1px solid rgba(0,0,0,0.12);
    }

    .subject-field {
      width: 100%;
      margin-bottom: 4px;
    }

    .compose-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }

    .body-field {
      flex: 1;
    }

    .send-button {
      margin-bottom: 20px;
    }

    /* Mobile responsive */
    @media (max-width: 767px) {
      .contacts-panel {
        width: 100%;
        min-width: 0;
      }

      .thread-panel {
        position: absolute;
        inset: 0;
        background: white;
        z-index: 10;
      }

      .hidden-mobile {
        display: none !important;
      }

      .messages-layout {
        position: relative;
      }
    }
  `],
})
export class MessageListComponent implements OnInit, AfterViewChecked {
  @ViewChild('messageContainer') messageContainer!: ElementRef<HTMLDivElement>;

  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private notifications = inject(NotificationService);
  private title = inject(Title);
  private dialog = inject(MatDialog);

  contacts = signal<MessageContact[]>([]);
  selectedContact = signal<MessageContact | null>(null);
  thread = signal<Message[]>([]);
  loading = signal(false);
  threadLoading = signal(false);
  mobileThreadOpen = signal(false);

  searchControl = new FormControl('');
  subjectControl = new FormControl('');
  bodyControl = new FormControl('');

  currentUserId = computed(() => this.authService.currentUser()?.id ?? 0);

  filteredContacts = computed(() => {
    const search = (this.searchControl.value ?? '').toLowerCase();
    if (!search) return this.contacts();
    return this.contacts().filter(c =>
      c.name.toLowerCase().includes(search) ||
      (c.company ?? '').toLowerCase().includes(search)
    );
  });

  private shouldScrollToBottom = false;

  ngOnInit(): void {
    this.title.setTitle('PlanHub — Messages');
    this.loadContacts();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.messageContainer) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  loadContacts(): void {
    this.loading.set(true);
    this.messageService.getContacts().subscribe({
      next: contacts => {
        this.contacts.set(contacts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectContact(contact: MessageContact): void {
    this.selectedContact.set(contact);
    if (this.isMobile()) {
      this.mobileThreadOpen.set(true);
    }
    this.loadThread(contact.id);
    // Auto-fill subject for reply
    this.subjectControl.setValue('Re: ' + (contact.name));
  }

  closeThread(): void {
    this.mobileThreadOpen.set(false);
    this.selectedContact.set(null);
  }

  loadThread(userId: number): void {
    this.threadLoading.set(true);
    this.messageService.getThread(userId).subscribe({
      next: messages => {
        this.thread.set(messages);
        this.threadLoading.set(false);
        this.shouldScrollToBottom = true;
        // Update unread count in contacts list
        this.contacts.update(contacts =>
          contacts.map(c => c.id === userId ? { ...c, unread_count: 0 } : c)
        );
      },
      error: () => this.threadLoading.set(false),
    });
  }

  onEnterKey(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const body = this.bodyControl.value?.trim();
    const subject = this.subjectControl.value?.trim() || 'Message';
    const contact = this.selectedContact();
    if (!body || !contact) return;

    this.messageService.sendMessage({
      recipient_id: contact.id,
      subject,
      body,
    }).subscribe({
      next: ({ data }) => {
        this.thread.update(msgs => [...msgs, data]);
        this.bodyControl.setValue('');
        this.shouldScrollToBottom = true;
        this.notifications.success('Message sent');
        // Update contact latest message
        this.contacts.update(contacts =>
          contacts.map(c =>
            c.id === contact.id
              ? { ...c, latest_message: body.substring(0, 100), latest_message_at: data.created_at }
              : c
          )
        );
      },
    });
  }

  openCompose(): void {
    const ref = this.dialog.open(ComposeDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe((result: { contact: MessageContact; message: Message } | undefined) => {
      if (result) {
        this.loadContacts();
        setTimeout(() => {
          const contact = this.contacts().find(c => c.id === result.contact.id)
            ?? result.contact;
          this.selectContact(contact);
        }, 300);
      }
    });
  }

  formatTime(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 24) {
      const h = Math.floor(diffHours);
      if (h < 1) return 'Just now';
      return `${h}h ago`;
    } else if (diffDays < 2) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  formatMessageTime(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messageContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
