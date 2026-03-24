import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { MessageService } from '../../../core/services/message.service';
import { ProjectService } from '../../../core/services/project.service';
import { Message, MessageContact } from '../../../shared/models/message.model';
import { Project } from '../../../shared/models/project.model';

@Component({
  selector: 'app-compose-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>New Message</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="compose-form">

        <!-- Recipient Autocomplete -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Recipient</mat-label>
          <input matInput
                 formControlName="recipientSearch"
                 [matAutocomplete]="auto"
                 placeholder="Search by name or company..." />
          <mat-autocomplete #auto="matAutocomplete"
                            [displayWith]="displayUser"
                            (optionSelected)="onRecipientSelected($event.option.value)">
            @for (user of userResults(); track user.id) {
              <mat-option [value]="user">
                <span>{{ user.name }}</span>
                <span class="company-hint"> — {{ user.company }}</span>
              </mat-option>
            }
            @if (userResults().length === 0 && (form.get('recipientSearch')!.value?.length ?? 0) > 1) {
              <mat-option disabled>No users found</mat-option>
            }
          </mat-autocomplete>
          @if (form.get('recipient_id')!.invalid && form.get('recipient_id')!.touched) {
            <mat-error>Please select a recipient</mat-error>
          }
        </mat-form-field>

        <!-- Subject -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Subject</mat-label>
          <input matInput formControlName="subject" />
          <mat-error>Subject is required</mat-error>
        </mat-form-field>

        <!-- Project (optional) -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project (optional)</mat-label>
          <mat-select formControlName="project_id">
            <mat-option [value]="null">None</mat-option>
            @for (project of projects(); track project.id) {
              <mat-option [value]="project.id">{{ project.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Body -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Message</mat-label>
          <textarea matInput formControlName="body" rows="5"></textarea>
          <mat-error>Message body is required</mat-error>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary"
              [disabled]="form.invalid || sending()"
              (click)="send()">
        <mat-icon>send</mat-icon>
        {{ sending() ? 'Sending...' : 'Send' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .compose-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 460px;
      padding-top: 8px;
    }

    .full-width {
      width: 100%;
    }

    .company-hint {
      color: rgba(0,0,0,0.54);
      font-size: 13px;
    }
  `],
})
export class ComposeDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private projectService = inject(ProjectService);
  private dialogRef = inject(MatDialogRef<ComposeDialogComponent>);

  userResults = signal<{ id: number; name: string; company: string }[]>([]);
  projects = signal<Project[]>([]);
  sending = signal(false);

  form = this.fb.group({
    recipientSearch: [''],
    recipient_id: [null as number | null, Validators.required],
    subject: ['', [Validators.required, Validators.maxLength(255)]],
    project_id: [null as number | null],
    body: ['', Validators.required],
  });

  ngOnInit(): void {
    this.form.get('recipientSearch')!.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(search => {
        if (!search || search.length < 2) return of([]);
        return this.messageService.searchUsers(search);
      })
    ).subscribe(users => this.userResults.set(users));

    this.projectService.getProjects({ per_page: 100 }).subscribe(r => {
      this.projects.set(r.data);
    });
  }

  displayUser(user: { id: number; name: string; company: string } | null): string {
    return user ? `${user.name} (${user.company})` : '';
  }

  onRecipientSelected(user: { id: number; name: string; company: string }): void {
    this.form.patchValue({ recipient_id: user.id });
  }

  send(): void {
    if (this.form.invalid) return;
    this.sending.set(true);

    const { recipient_id, subject, body, project_id } = this.form.value;
    const payload: { recipient_id: number; subject: string; body: string; project_id?: number } = {
      recipient_id: recipient_id!,
      subject: subject!,
      body: body!,
    };
    if (project_id) payload.project_id = project_id;

    this.messageService.sendMessage(payload).subscribe({
      next: ({ data }) => {
        const recipientSearch = this.form.get('recipientSearch')!.value;
        const user = this.userResults().find(u => u.id === recipient_id)
          ?? { id: recipient_id!, name: recipientSearch ?? '', company: '' };

        const contact: MessageContact = {
          id: user.id,
          name: user.name,
          company: user.company,
          latest_message: body!.substring(0, 100),
          latest_message_at: data.created_at,
          unread_count: 0,
        };

        this.dialogRef.close({ contact, message: data });
      },
      error: () => this.sending.set(false),
    });
  }
}
