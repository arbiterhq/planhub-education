import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InvoiceService } from '../../../core/services/invoice.service';
import { Invoice } from '../../../shared/models/invoice.model';

export interface InvoiceDetailDialogData {
  invoiceId: number;
}

// ── Inline shared dialogs (avoids circular imports with invoice-list) ──────────

@Component({
  selector: 'app-invoice-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content><p>{{ data.message }}</p></mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button [color]="data.confirmColor || 'primary'" [mat-dialog-close]="true">
        {{ data.confirmLabel || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class InvoiceConfirmDialogComponent {
  data = inject<{ title: string; message: string; confirmLabel?: string; confirmColor?: string }>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-invoice-reject-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Reject Invoice</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%; min-width:380px;">
        <mat-label>Rejection notes (optional)</mat-label>
        <textarea matInput [formControl]="notes" rows="3" placeholder="Reason for rejection…"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="{ confirmed: true, notes: notes.value }">
        Confirm Reject
      </button>
    </mat-dialog-actions>
  `,
})
export class InvoiceRejectDialogComponent {
  notes = new FormControl('');
}

// ── Main Component ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-invoice-detail-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    PercentPipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="dialog-header">
      @if (invoice()) {
        <div class="header-left">
          <h2 mat-dialog-title>{{ invoice()!.invoice_number }}</h2>
          <mat-chip [class]="'status-chip inv-' + invoice()!.status">
            {{ statusLabel(invoice()!.status) }}
          </mat-chip>
        </div>
      } @else {
        <h2 mat-dialog-title>Invoice Details</h2>
      }
    </div>

    <mat-dialog-content>
      @if (loading()) {
        <div class="spinner-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (invoice()) {
        <!-- From / To -->
        <div class="from-to-row">
          <div class="from-to-block">
            <div class="block-title">FROM</div>
            <div class="company-name">{{ invoice()!.company?.name ?? '—' }}</div>
            @if (invoice()!.company?.city) {
              <div class="company-detail">{{ invoice()!.company!.city }}, {{ invoice()!.company!.state }}</div>
            }
            @if (invoice()!.company?.phone) {
              <div class="company-detail">{{ invoice()!.company!.phone }}</div>
            }
            @if (invoice()!.company?.email) {
              <div class="company-detail">{{ invoice()!.company!.email }}</div>
            }
          </div>
          <mat-icon class="arrow-icon">arrow_forward</mat-icon>
          <div class="from-to-block">
            <div class="block-title">TO</div>
            <div class="company-name">Apex Construction Group</div>
            <div class="company-detail">Austin, TX</div>
          </div>
        </div>

        <!-- Invoice Amount (prominent) -->
        <div class="amount-block">
          <div class="amount-label">Invoice Amount</div>
          <div class="amount-value">{{ invoice()!.amount | currency }}</div>
        </div>

        <!-- Details Grid -->
        <section class="section">
          <h3 class="section-title">Details</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Project</span>
              <span class="detail-value">{{ invoice()!.project?.name ?? '—' }}</span>
            </div>
            @if (invoice()!.contract?.trade) {
              <div class="detail-item">
                <span class="detail-label">Trade / Scope</span>
                <span class="detail-value">{{ getContractTrade() }}</span>
              </div>
            }
            @if (invoice()!.contract) {
              <div class="detail-item">
                <span class="detail-label">Contract Amount</span>
                <span class="detail-value">{{ invoice()!.contract!.amount | currency }}</span>
              </div>
            }
            @if (invoice()!.due_date) {
              <div class="detail-item">
                <span class="detail-label">Due Date</span>
                <span class="detail-value" [class.overdue]="isDueOverdue()">
                  {{ invoice()!.due_date | date:'MMMM d, y' }}
                  @if (isDueOverdue()) { <mat-icon class="overdue-icon" matTooltip="Overdue">warning</mat-icon> }
                </span>
              </div>
            }
            @if (invoice()!.submitted_at) {
              <div class="detail-item">
                <span class="detail-label">Submitted</span>
                <span class="detail-value">{{ invoice()!.submitted_at | date:'MMM d, y h:mm a' }}</span>
              </div>
            }
            @if (invoice()!.approved_at) {
              <div class="detail-item">
                <span class="detail-label">Approved</span>
                <span class="detail-value">{{ invoice()!.approved_at | date:'MMM d, y h:mm a' }}</span>
              </div>
            }
            @if (invoice()!.paid_at) {
              <div class="detail-item">
                <span class="detail-label">Paid</span>
                <span class="detail-value paid-date">{{ invoice()!.paid_at | date:'MMM d, y h:mm a' }}</span>
              </div>
            }
          </div>

          @if (invoice()!.description) {
            <div class="description-block">
              <span class="detail-label">Description</span>
              <p class="description-text">{{ invoice()!.description }}</p>
            </div>
          }
        </section>

        <!-- Status Timeline -->
        <section class="section">
          <h3 class="section-title">Status Timeline</h3>
          <div class="timeline">
            @for (step of timelineSteps(); track step.key; let last = $last) {
              <div class="timeline-step" [class.completed]="step.completed" [class.current]="step.current">
                <div class="step-circle">
                  @if (step.completed) {
                    <mat-icon>check_circle</mat-icon>
                  } @else if (step.current) {
                    <mat-icon>radio_button_checked</mat-icon>
                  } @else {
                    <mat-icon>radio_button_unchecked</mat-icon>
                  }
                </div>
                <div class="step-label">{{ step.label }}</div>
              </div>
              @if (!last) {
                <div class="timeline-line" [class.filled]="step.completed"></div>
              }
            }
          </div>
          @if (invoice()!.status === 'rejected') {
            <div class="rejected-badge">
              <mat-icon>cancel</mat-icon> Invoice Rejected
            </div>
          }
        </section>

        <!-- Contract Context -->
        @if (invoice()!.contract) {
          <section class="section">
            <h3 class="section-title">Contract Context</h3>
            <div class="contract-context">
              <div class="context-row">
                <span class="context-label">Contract Amount</span>
                <span class="context-value">{{ invoice()!.contract!.amount | currency }}</span>
              </div>
              <div class="context-row">
                <span class="context-label">Total Invoiced to Date</span>
                <span class="context-value">{{ totalInvoiced() | currency }}</span>
              </div>
              <div class="context-row">
                <span class="context-label">Remaining Balance</span>
                <span class="context-value" [class.balance-low]="remainingBalance() < 0">
                  {{ remainingBalance() | currency }}
                </span>
              </div>
              <div class="progress-row">
                <mat-progress-bar
                  mode="determinate"
                  [value]="invoicedPercent()"
                  [color]="invoicedPercent() >= 100 ? 'warn' : 'primary'">
                </mat-progress-bar>
                <span class="progress-label">
                  {{ invoicedPercent() / 100 | percent:'1.0-0' }} invoiced of contract
                </span>
              </div>
            </div>
          </section>
        }

        <!-- Notes -->
        @if (invoice()!.notes) {
          <section class="section last">
            <h3 class="section-title">Reviewer Notes</h3>
            <p class="notes-text">{{ invoice()!.notes }}</p>
          </section>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
      @if (invoice()?.status === 'submitted' || invoice()?.status === 'under_review') {
        <button mat-stroked-button color="warn" (click)="openRejectDialog()" [disabled]="saving()">
          Reject
        </button>
        <button mat-raised-button color="primary" (click)="approveInvoice()" [disabled]="saving()">
          @if (saving()) { <mat-spinner diameter="18" class="btn-spinner"></mat-spinner> }
          Approve
        </button>
      } @else if (invoice()?.status === 'approved') {
        <button mat-raised-button color="primary" (click)="payInvoice()" [disabled]="saving()">
          @if (saving()) { <mat-spinner diameter="18" class="btn-spinner"></mat-spinner> }
          Mark Paid
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 560px; max-width: 720px; padding-bottom: 8px; max-height: 70vh; overflow-y: auto; }

    .dialog-header { padding: 16px 24px 0; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    h2[mat-dialog-title] { margin: 0; font-size: 20px; font-weight: 600; }

    .spinner-center { display: flex; justify-content: center; padding: 32px; }

    /* From / To */
    .from-to-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: rgba(0,0,0,0.03);
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .from-to-block { flex: 1; }
    .block-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(0,0,0,0.4); margin-bottom: 4px; }
    .company-name { font-size: 15px; font-weight: 600; }
    .company-detail { font-size: 13px; color: rgba(0,0,0,0.55); line-height: 1.5; }
    .arrow-icon { color: rgba(0,0,0,0.3); flex-shrink: 0; }

    /* Amount Block */
    .amount-block {
      text-align: center;
      padding: 16px;
      background: rgba(25,118,210,0.06);
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .amount-label { font-size: 11px; text-transform: uppercase; color: rgba(0,0,0,0.45); letter-spacing: 0.5px; }
    .amount-value { font-size: 32px; font-weight: 700; color: #1565c0; }

    /* Sections */
    .section { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.08); }
    .section.last, .section:last-child { border-bottom: none; margin-bottom: 0; }
    .section-title { margin: 0 0 12px; font-size: 12px; font-weight: 600; color: rgba(0,0,0,0.5); text-transform: uppercase; letter-spacing: 0.5px; }

    /* Detail Grid */
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-label { font-size: 11px; text-transform: uppercase; color: rgba(0,0,0,0.45); letter-spacing: 0.5px; }
    .detail-value { font-size: 14px; }
    .overdue { color: #c62828; font-weight: 500; }
    .overdue-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; color: #c62828; }
    .paid-date { color: #2e7d32; }

    .description-block { margin-top: 8px; }
    .description-text { font-size: 13px; color: rgba(0,0,0,0.7); margin: 4px 0 0; white-space: pre-wrap; }

    /* Timeline */
    .timeline { display: flex; align-items: flex-start; }
    .timeline-step { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
    .step-circle mat-icon { font-size: 22px; width: 22px; height: 22px; color: rgba(0,0,0,0.2); }
    .timeline-step.completed .step-circle mat-icon { color: #2e7d32; }
    .timeline-step.current .step-circle mat-icon { color: #1976d2; }
    .step-label { font-size: 11px; color: rgba(0,0,0,0.45); white-space: nowrap; text-align: center; }
    .timeline-step.completed .step-label { color: #2e7d32; font-weight: 500; }
    .timeline-step.current .step-label { color: #1976d2; font-weight: 600; }
    .timeline-line { flex: 1; height: 2px; background: rgba(0,0,0,0.1); margin-bottom: 18px; margin-top: 11px; }
    .timeline-line.filled { background: #2e7d32; }
    .rejected-badge {
      display: flex; align-items: center; gap: 6px; margin-top: 12px;
      color: #c62828; font-size: 13px; font-weight: 500;
    }
    .rejected-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Contract Context */
    .contract-context {}
    .context-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
    .context-row:last-of-type { border-bottom: none; }
    .context-label { font-size: 13px; color: rgba(0,0,0,0.55); }
    .context-value { font-size: 14px; font-weight: 500; }
    .balance-low { color: #c62828; }
    .progress-row { margin-top: 12px; }
    .progress-label { font-size: 12px; color: rgba(0,0,0,0.5); margin-top: 4px; display: block; text-align: right; }

    /* Notes */
    .notes-text { font-size: 13px; color: rgba(0,0,0,0.7); margin: 0; white-space: pre-wrap; padding: 10px; background: rgba(0,0,0,0.03); border-radius: 4px; border-left: 3px solid rgba(0,0,0,0.1); }

    /* Status chips */
    .status-chip { font-size: 12px; }
    :host ::ng-deep .inv-draft { background-color: rgba(0,0,0,0.15) !important; }
    :host ::ng-deep .inv-submitted { background-color: #1976d2 !important; color: white !important; }
    :host ::ng-deep .inv-under_review { background-color: #f57c00 !important; color: white !important; }
    :host ::ng-deep .inv-approved { background-color: #388e3c !important; color: white !important; }
    :host ::ng-deep .inv-paid { background-color: #00796b !important; color: white !important; }
    :host ::ng-deep .inv-rejected { background-color: #d32f2f !important; color: white !important; }

    .btn-spinner { display: inline-block; margin-right: 8px; }
    :host ::ng-deep .btn-spinner circle { stroke: white; }
  `],
})
export class InvoiceDetailDialogComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<InvoiceDetailDialogComponent>);
  private dialogData = inject<InvoiceDetailDialogData>(MAT_DIALOG_DATA);

  invoice = signal<Invoice | null>(null);
  loading = signal(false);
  saving = signal(false);
  totalInvoiced = signal(0);

  ngOnInit(): void {
    this.loading.set(true);
    this.invoiceService.getInvoice(this.dialogData.invoiceId).subscribe({
      next: (res) => {
        this.invoice.set(res.data);
        this.totalInvoiced.set(res.total_invoiced_for_contract);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  remainingBalance(): number {
    const inv = this.invoice();
    if (!inv?.contract) return 0;
    return inv.contract.amount - this.totalInvoiced();
  }

  invoicedPercent(): number {
    const inv = this.invoice();
    if (!inv?.contract || inv.contract.amount === 0) return 0;
    return Math.min(100, (this.totalInvoiced() / inv.contract.amount) * 100);
  }

  getContractTrade(): string {
    const contract = this.invoice()?.contract;
    if (!contract?.trade) return '—';
    return (contract.trade as any).name ?? '—';
  }

  isDueOverdue(): boolean {
    const inv = this.invoice();
    if (!inv?.due_date || inv.status === 'paid' || inv.status === 'rejected') return false;
    return new Date(inv.due_date) < new Date();
  }

  timelineSteps(): { key: string; label: string; completed: boolean; current: boolean }[] {
    const status = this.invoice()?.status ?? '';
    const order = ['submitted', 'under_review', 'approved', 'paid'];
    const labels: Record<string, string> = {
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      paid: 'Paid',
    };
    const currentIdx = order.indexOf(status);
    return order.map((key, i) => ({
      key,
      label: labels[key],
      completed: currentIdx > i,
      current: key === status,
    }));
  }

  approveInvoice(): void {
    this.dialog.open(InvoiceConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Approve Invoice', message: 'Approve this invoice?', confirmLabel: 'Approve' },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      const inv = this.invoice();
      if (!inv) return;
      this.saving.set(true);
      this.invoiceService.reviewInvoice(inv.id, 'approve').subscribe({
        next: (res) => {
          this.invoice.set(res.data);
          this.saving.set(false);
          this.snackBar.open('Invoice approved.', 'Dismiss', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to approve invoice.', 'Dismiss', { duration: 4000 });
        },
      });
    });
  }

  openRejectDialog(): void {
    this.dialog.open(InvoiceRejectDialogComponent, {
      width: '440px',
    }).afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      const inv = this.invoice();
      if (!inv) return;
      this.saving.set(true);
      this.invoiceService.reviewInvoice(inv.id, 'reject', result.notes || undefined).subscribe({
        next: (res) => {
          this.invoice.set(res.data);
          this.saving.set(false);
          this.snackBar.open('Invoice rejected.', 'Dismiss', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to reject invoice.', 'Dismiss', { duration: 4000 });
        },
      });
    });
  }

  payInvoice(): void {
    this.dialog.open(InvoiceConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Mark as Paid', message: 'Mark this invoice as paid?', confirmLabel: 'Mark Paid' },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      const inv = this.invoice();
      if (!inv) return;
      this.saving.set(true);
      this.invoiceService.payInvoice(inv.id).subscribe({
        next: (res) => {
          this.invoice.set(res.data);
          this.saving.set(false);
          this.snackBar.open('Invoice marked as paid.', 'Dismiss', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to mark as paid.', 'Dismiss', { duration: 4000 });
        },
      });
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
      approved: 'Approved', paid: 'Paid', rejected: 'Rejected',
    };
    return labels[status] ?? status;
  }

  close(): void { this.dialogRef.close(false); }
}
