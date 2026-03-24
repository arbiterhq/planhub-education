import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subject, combineLatest, startWith, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ProjectService } from '../../../core/services/project.service';
import { SubcontractorService } from '../../../core/services/subcontractor.service';
import { Invoice, InvoiceSummary } from '../../../shared/models/invoice.model';
import { Project } from '../../../shared/models/project.model';
import { Subcontractor } from '../../../shared/models/subcontractor.model';
import { InvoiceDetailDialogComponent } from '../invoice-detail-dialog/invoice-detail-dialog.component';
import { CreateInvoiceDialogComponent } from '../create-invoice-dialog/create-invoice-dialog.component';

// ── Inline Dialogs ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-confirm-action-dialog',
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
export class ConfirmActionDialogComponent {
  data = inject<{ title: string; message: string; confirmLabel?: string; confirmColor?: string }>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-reject-invoice-inline-dialog',
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
export class RejectInvoiceInlineDialogComponent {
  notes = new FormControl('');
}

// ── Main Component ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Invoices</h1>
        <button mat-stroked-button class="demo-btn" (click)="openCreateInvoice()">
          <mat-icon>add</mat-icon>
          Create Invoice
          <span class="demo-badge">DEMO</span>
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <mat-card class="summary-card outstanding">
          <mat-card-content>
            <div class="card-icon"><mat-icon>account_balance_wallet</mat-icon></div>
            <div class="card-value">{{ summary()?.total_outstanding | currency:'USD':'symbol':'1.0-0' }}</div>
            <div class="card-label">Total Outstanding</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card pending">
          <mat-card-content>
            <div class="card-icon"><mat-icon>pending_actions</mat-icon></div>
            <div class="card-value count">{{ summary()?.pending_review ?? '—' }}</div>
            <div class="card-label">Pending Review</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card approved">
          <mat-card-content>
            <div class="card-icon"><mat-icon>check_circle_outline</mat-icon></div>
            <div class="card-value count">{{ summary()?.approved_unpaid ?? '—' }}</div>
            <div class="card-label">Approved (Unpaid)</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card paid">
          <mat-card-content>
            <div class="card-icon"><mat-icon>payments</mat-icon></div>
            <div class="card-value">{{ summary()?.paid_this_month | currency:'USD':'symbol':'1.0-0' }}</div>
            <div class="card-label">Paid This Month</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusFilter">
            <mat-option [value]="null">All Statuses</mat-option>
            <mat-option value="submitted">Submitted</mat-option>
            <mat-option value="under_review">Under Review</mat-option>
            <mat-option value="approved">Approved</mat-option>
            <mat-option value="paid">Paid</mat-option>
            <mat-option value="rejected">Rejected</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Project</mat-label>
          <mat-select [formControl]="projectFilter">
            <mat-option [value]="null">All Projects</mat-option>
            @for (p of projects(); track p.id) {
              <mat-option [value]="p.id">{{ p.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Subcontractor</mat-label>
          <mat-select [formControl]="subFilter">
            <mat-option [value]="null">All Subcontractors</mat-option>
            @for (s of subcontractors(); track s.id) {
              <mat-option [value]="s.id">{{ s.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field date-field">
          <mat-label>From Date</mat-label>
          <input matInput type="date" [formControl]="dateFromFilter">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field date-field">
          <mat-label>To Date</mat-label>
          <input matInput type="date" [formControl]="dateToFilter">
        </mat-form-field>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
      } @else {
        <table mat-table [dataSource]="invoices()" matSort (matSortChange)="onSort($event)" class="data-table">

          <ng-container matColumnDef="invoice_number">
            <th mat-header-cell *matHeaderCellDef>Invoice #</th>
            <td mat-cell *matCellDef="let row">
              <span class="invoice-number-link" (click)="openDetail(row); $event.stopPropagation()">
                {{ row.invoice_number }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="project">
            <th mat-header-cell *matHeaderCellDef>Project</th>
            <td mat-cell *matCellDef="let row" (click)="$event.stopPropagation()">
              @if (row.project) {
                <a class="entity-link" [routerLink]="'/projects/' + row.project.id">{{ row.project.name }}</a>
              } @else { — }
            </td>
          </ng-container>

          <ng-container matColumnDef="subcontractor">
            <th mat-header-cell *matHeaderCellDef>Subcontractor</th>
            <td mat-cell *matCellDef="let row" (click)="$event.stopPropagation()">
              @if (row.company) {
                <a class="entity-link" [routerLink]="'/subcontractors/' + row.company.id">{{ row.company.name }}</a>
              } @else { — }
            </td>
          </ng-container>

          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="amount">Amount</th>
            <td mat-cell *matCellDef="let row" class="amount-cell">{{ row.amount | currency }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip [class]="'status-chip inv-' + row.status">
                {{ statusLabel(row.status) }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="due_date">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="due_date">Due Date</th>
            <td mat-cell *matCellDef="let row" [class.overdue-date]="isOverdue(row)">
              {{ row.due_date ? (row.due_date | date:'MMM d, y') : '—' }}
              @if (isOverdue(row)) { <mat-icon class="overdue-icon" matTooltip="Overdue">warning</mat-icon> }
            </td>
          </ng-container>

          <ng-container matColumnDef="submitted_at">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="submitted_at">Submitted</th>
            <td mat-cell *matCellDef="let row">
              {{ row.submitted_at ? (row.submitted_at | date:'MMM d, y') : '—' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="actions-cell" (click)="$event.stopPropagation()">
              @if (row.status === 'submitted') {
                <button mat-stroked-button color="primary" (click)="openDetail(row)">
                  Review
                </button>
              } @else if (row.status === 'under_review') {
                <div class="action-group">
                  <button mat-stroked-button color="primary" (click)="approveInvoice(row)">Approve</button>
                  <button mat-stroked-button color="warn" (click)="openRejectDialog(row)">Reject</button>
                </div>
              } @else if (row.status === 'approved') {
                <button mat-raised-button color="primary" (click)="payInvoice(row)">Mark Paid</button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;" class="clickable-row" (click)="openDetail(row)"></tr>

          @if (invoices().length === 0) {
            <tr class="no-data-row">
              <td [attr.colspan]="columns.length" class="no-data-cell">No invoices found.</td>
            </tr>
          }
        </table>

        <mat-paginator
          [length]="total()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons
        ></mat-paginator>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }

    .demo-btn {
      border-style: dashed !important;
      color: #5c6bc0 !important;
      border-color: #5c6bc0 !important;
    }
    .demo-badge {
      font-size: 9px;
      background: #5c6bc0;
      color: white;
      border-radius: 3px;
      padding: 1px 4px;
      margin-left: 6px;
      vertical-align: middle;
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card { cursor: default; }
    mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 20px 16px !important;
    }
    .card-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 26px;
      font-weight: 700;
      line-height: 1.2;
    }
    .card-value.count { font-size: 32px; }
    .card-label {
      font-size: 12px;
      color: rgba(0,0,0,0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .outstanding .card-icon mat-icon { color: #1565c0; }
    .outstanding .card-value { color: #1565c0; }
    .pending .card-icon mat-icon { color: #e65100; }
    .pending .card-value { color: #e65100; }
    .approved .card-icon mat-icon { color: #2e7d32; }
    .approved .card-value { color: #2e7d32; }
    .paid .card-icon mat-icon { color: #00695c; }
    .paid .card-value { color: #00695c; }

    /* Filter Bar */
    .filter-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
      align-items: flex-start;
    }
    .filter-field { width: 180px; }
    .date-field { width: 160px; }

    .spinner-container { display: flex; justify-content: center; padding: 64px 0; }

    .data-table { width: 100%; }

    .invoice-number-link {
      color: #1976d2;
      cursor: pointer;
      font-weight: 500;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .invoice-number-link:hover { color: #1565c0; }

    .entity-link {
      color: #1976d2;
      text-decoration: none;
    }
    .entity-link:hover { text-decoration: underline; }

    .amount-cell { font-weight: 500; }

    .overdue-date { color: #c62828; font-weight: 500; }
    .overdue-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      vertical-align: middle;
      margin-left: 4px;
      color: #c62828;
    }

    .actions-cell { white-space: nowrap; }
    .action-group { display: flex; gap: 8px; }

    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(0,0,0,0.03); }

    .no-data-row td { padding: 32px; text-align: center; color: rgba(0,0,0,0.4); }

    /* Status chips */
    .status-chip { font-size: 12px; }
    :host ::ng-deep .inv-draft { background-color: rgba(0,0,0,0.15) !important; }
    :host ::ng-deep .inv-submitted { background-color: #1976d2 !important; color: white !important; }
    :host ::ng-deep .inv-under_review { background-color: #f57c00 !important; color: white !important; }
    :host ::ng-deep .inv-approved { background-color: #388e3c !important; color: white !important; }
    :host ::ng-deep .inv-paid { background-color: #00796b !important; color: white !important; }
    :host ::ng-deep .inv-rejected { background-color: #d32f2f !important; color: white !important; }

    @media (max-width: 900px) {
      .summary-cards { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private invoiceService = inject(InvoiceService);
  private projectService = inject(ProjectService);
  private subcontractorService = inject(SubcontractorService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Data
  invoices = signal<Invoice[]>([]);
  summary = signal<InvoiceSummary | null>(null);
  projects = signal<Project[]>([]);
  subcontractors = signal<Subcontractor[]>([]);

  // State
  loading = signal(false);
  total = signal(0);
  pageSize = 15;
  pageIndex = 0;
  sortField = 'created_at';
  sortDir = 'desc';

  // Filters
  statusFilter = new FormControl<string | null>(null);
  projectFilter = new FormControl<number | null>(null);
  subFilter = new FormControl<number | null>(null);
  dateFromFilter = new FormControl<string | null>(null);
  dateToFilter = new FormControl<string | null>(null);

  columns = ['invoice_number', 'project', 'subcontractor', 'amount', 'status', 'due_date', 'submitted_at', 'actions'];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadSummary();

    this.projectService.getProjects({ per_page: 100 }).subscribe(res => {
      this.projects.set(res.data);
    });

    this.subcontractorService.getSubcontractors({ per_page: 100 }).subscribe(res => {
      this.subcontractors.set(res.data);
    });

    combineLatest([
      this.statusFilter.valueChanges.pipe(startWith(null)),
      this.projectFilter.valueChanges.pipe(startWith(null)),
      this.subFilter.valueChanges.pipe(startWith(null)),
      this.dateFromFilter.valueChanges.pipe(startWith(null)),
      this.dateToFilter.valueChanges.pipe(startWith(null)),
    ]).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.pageIndex = 0;
      this.loadInvoices();
    });
  }

  loadSummary(): void {
    this.invoiceService.getSummary().subscribe(s => this.summary.set(s));
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.invoiceService.getInvoices({
      status: this.statusFilter.value ?? undefined,
      project_id: this.projectFilter.value ?? undefined,
      company_id: this.subFilter.value ?? undefined,
      date_from: this.dateFromFilter.value ?? undefined,
      date_to: this.dateToFilter.value ?? undefined,
      sort: this.sortField,
      direction: this.sortDir,
      page: this.pageIndex + 1,
      per_page: this.pageSize,
    }).subscribe({
      next: (res) => {
        this.invoices.set(res.data);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSort(sort: Sort): void {
    this.sortField = sort.active || 'created_at';
    this.sortDir = sort.direction || 'desc';
    this.pageIndex = 0;
    this.loadInvoices();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInvoices();
  }

  openDetail(invoice: Invoice): void {
    this.dialog.open(InvoiceDetailDialogComponent, {
      width: '760px',
      data: { invoiceId: invoice.id },
    }).afterClosed().subscribe(changed => {
      if (changed) {
        this.loadInvoices();
        this.loadSummary();
      }
    });
  }

  openCreateInvoice(): void {
    this.dialog.open(CreateInvoiceDialogComponent, {
      width: '560px',
    }).afterClosed().subscribe(created => {
      if (created) {
        this.loadInvoices();
        this.loadSummary();
      }
    });
  }

  approveInvoice(invoice: Invoice): void {
    this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: {
        title: 'Approve Invoice',
        message: `Approve invoice ${invoice.invoice_number} for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount)}?`,
        confirmLabel: 'Approve',
        confirmColor: 'primary',
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.invoiceService.reviewInvoice(invoice.id, 'approve').subscribe({
        next: () => {
          this.snackBar.open('Invoice approved.', 'Dismiss', { duration: 3000 });
          this.loadInvoices();
          this.loadSummary();
        },
        error: () => this.snackBar.open('Failed to approve invoice.', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  openRejectDialog(invoice: Invoice): void {
    this.dialog.open(RejectInvoiceInlineDialogComponent, {
      width: '440px',
    }).afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      this.invoiceService.reviewInvoice(invoice.id, 'reject', result.notes || undefined).subscribe({
        next: () => {
          this.snackBar.open('Invoice rejected.', 'Dismiss', { duration: 3000 });
          this.loadInvoices();
          this.loadSummary();
        },
        error: () => this.snackBar.open('Failed to reject invoice.', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  payInvoice(invoice: Invoice): void {
    this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: {
        title: 'Mark as Paid',
        message: `Mark invoice ${invoice.invoice_number} as paid?`,
        confirmLabel: 'Mark Paid',
        confirmColor: 'primary',
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.invoiceService.payInvoice(invoice.id).subscribe({
        next: () => {
          this.snackBar.open('Invoice marked as paid.', 'Dismiss', { duration: 3000 });
          this.loadInvoices();
          this.loadSummary();
        },
        error: () => this.snackBar.open('Failed to mark invoice as paid.', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  isOverdue(invoice: Invoice): boolean {
    if (!invoice.due_date || invoice.status === 'paid' || invoice.status === 'rejected') {
      return false;
    }
    return new Date(invoice.due_date) < new Date();
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      paid: 'Paid',
      rejected: 'Rejected',
    };
    return labels[status] ?? status;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
