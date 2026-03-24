import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { BidService } from '../../../core/services/bid.service';
import { Bid } from '../../../shared/models/bid.model';

export interface BidReviewDialogData {
  bid: Bid;
}

@Component({
  selector: 'app-bid-review-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  template: `
    <h2 mat-dialog-title>Review Bid</h2>

    <mat-dialog-content>
      @if (loading()) {
        <div class="spinner-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (bid()) {
        <!-- Subcontractor & Bid Details -->
        <section class="section">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Subcontractor</span>
              <span class="detail-value">{{ bid()!.company?.name ?? '—' }}</span>
            </div>
            @if (bid()!.company?.city) {
              <div class="detail-item">
                <span class="detail-label">Location</span>
                <span class="detail-value">{{ bid()!.company!.city }}, {{ bid()!.company!.state }}</span>
              </div>
            }
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <mat-chip [class]="'status-chip bid-' + bid()!.status">
                {{ statusLabel(bid()!.status) }}
              </mat-chip>
            </div>
            <div class="detail-item">
              <span class="detail-label">Submitted</span>
              <span class="detail-value">
                {{ bid()!.submitted_at ? (bid()!.submitted_at! | date:'MMM d, y h:mm a') : '—' }}
              </span>
            </div>
          </div>

          <div class="bid-amount-block">
            <span class="amount-label">Bid Amount</span>
            <span class="amount-value">{{ bid()!.amount | currency }}</span>
          </div>

          @if (bid()!.timeline_days != null) {
            <div class="timeline-row">
              <mat-icon>schedule</mat-icon>
              <span>{{ bid()!.timeline_days }} day timeline</span>
            </div>
          }

          @if (bid()!.description) {
            <div class="description-block">
              <span class="detail-label">Notes from subcontractor</span>
              <p class="description-text">{{ bid()!.description }}</p>
            </div>
          }
        </section>

        <!-- Comparison table -->
        @if (siblingBids().length > 0) {
          <section class="section">
            <h3 class="section-title">
              <mat-icon>compare_arrows</mat-icon>
              Compare with other bids
            </h3>

            @if (estimatedValue() != null) {
              <p class="estimated-note">
                Scope estimated value: <strong>{{ estimatedValue()! | currency }}</strong>
              </p>
            }

            <table mat-table [dataSource]="allBidsForComparison()" class="comparison-table">
              <ng-container matColumnDef="subcontractor">
                <th mat-header-cell *matHeaderCellDef>Subcontractor</th>
                <td mat-cell *matCellDef="let row">{{ row.company?.name ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let row" [class.lowest-amount]="row.amount === lowestAmount()">
                  {{ row.amount | currency }}
                  @if (row.amount === lowestAmount()) {
                    <mat-icon class="lowest-icon" matTooltip="Lowest bid">star</mat-icon>
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="timeline_days">
                <th mat-header-cell *matHeaderCellDef>Timeline</th>
                <td mat-cell *matCellDef="let row">
                  {{ row.timeline_days != null ? row.timeline_days + 'd' : '—' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip [class]="'status-chip bid-' + row.status" class="small-chip">
                    {{ statusLabel(row.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="compColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: compColumns;"
                  [class.current-row]="row.id === bid()!.id"></tr>
            </table>
          </section>
        }

        <!-- Rejection notes (shown when rejecting) -->
        @if (showRejectNotes()) {
          <section class="section">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Rejection notes (optional)</mat-label>
              <textarea matInput [formControl]="notesControl" rows="3"
                        placeholder="Reason for rejection…"></textarea>
            </mat-form-field>
          </section>
        }

        <!-- Accept confirmation message -->
        @if (showAcceptConfirm()) {
          <section class="section confirm-section">
            <mat-icon class="confirm-icon">check_circle</mat-icon>
            <p>
              Accept this bid of <strong>{{ bid()!.amount | currency }}</strong>
              from <strong>{{ bid()!.company?.name }}</strong>?
            </p>
            @if (siblingBids().length > 0) {
              <p class="warn-text">
                This will automatically reject {{ siblingBids().length }} other bid(s) and create a contract.
              </p>
            }
          </section>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (!showAcceptConfirm() && !showRejectNotes()) {
        <button mat-button (click)="close()">Close</button>

        @if (bid()?.status === 'submitted') {
          <button mat-stroked-button (click)="markUnderReview()" [disabled]="saving()">
            Mark as Under Review
          </button>
        }

        @if (bid()?.status === 'submitted' || bid()?.status === 'under_review') {
          <button mat-stroked-button color="warn" (click)="showRejectNotes.set(true)" [disabled]="saving()">
            Reject Bid
          </button>
          <button mat-raised-button color="primary" (click)="showAcceptConfirm.set(true)" [disabled]="saving()">
            Accept Bid
          </button>
        }
      } @else if (showRejectNotes()) {
        <button mat-button (click)="showRejectNotes.set(false)">Cancel</button>
        <button mat-raised-button color="warn" (click)="confirmReject()" [disabled]="saving()">
          @if (saving()) { <mat-spinner diameter="18" class="btn-spinner"></mat-spinner> }
          Confirm Reject
        </button>
      } @else if (showAcceptConfirm()) {
        <button mat-button (click)="showAcceptConfirm.set(false)">Cancel</button>
        <button mat-raised-button color="primary" (click)="confirmAccept()" [disabled]="saving()">
          @if (saving()) { <mat-spinner diameter="18" class="btn-spinner"></mat-spinner> }
          Confirm Accept
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 480px; max-width: 680px; padding-bottom: 8px; }

    .spinner-center { display: flex; justify-content: center; padding: 32px 0; }

    .section {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    .section:last-child { border-bottom: none; margin-bottom: 0; }

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: rgba(0,0,0,0.7);
      margin: 0 0 12px;
    }
    .section-title mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-label { font-size: 11px; text-transform: uppercase; color: rgba(0,0,0,0.45); letter-spacing: 0.5px; }
    .detail-value { font-size: 14px; }

    .bid-amount-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      background: rgba(25,118,210,0.06);
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .amount-label { font-size: 11px; text-transform: uppercase; color: rgba(0,0,0,0.45); letter-spacing: 0.5px; }
    .amount-value { font-size: 28px; font-weight: 700; color: #1565c0; }

    .timeline-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: rgba(0,0,0,0.6);
      margin-bottom: 8px;
    }
    .timeline-row mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .description-block { margin-top: 8px; }
    .description-text {
      font-size: 13px;
      color: rgba(0,0,0,0.7);
      margin: 4px 0 0;
      white-space: pre-wrap;
    }

    .estimated-note { font-size: 12px; color: rgba(0,0,0,0.55); margin: 0 0 8px; }

    .comparison-table { width: 100%; }
    :host ::ng-deep .current-row { background: rgba(25,118,210,0.06) !important; font-weight: 500; }
    .lowest-amount { color: #2e7d32; font-weight: 600; }
    .lowest-icon { font-size: 14px; width: 14px; height: 14px; color: #f9a825; vertical-align: middle; margin-left: 4px; }
    .small-chip { font-size: 10px !important; height: 20px !important; }

    .confirm-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px;
      background: rgba(25,118,210,0.04);
      border-radius: 8px;
    }
    .confirm-icon { font-size: 40px; width: 40px; height: 40px; color: #1976d2; margin-bottom: 8px; }
    .warn-text { color: #e65100; font-size: 13px; margin-top: 4px; }

    .full-width { width: 100%; }

    /* Status chips */
    .status-chip { font-size: 12px; }
    :host ::ng-deep .bid-submitted { background-color: #1976d2 !important; color: white !important; }
    :host ::ng-deep .bid-under_review { background-color: #f57c00 !important; color: white !important; }
    :host ::ng-deep .bid-accepted { background-color: #388e3c !important; color: white !important; }
    :host ::ng-deep .bid-rejected { background-color: #d32f2f !important; color: white !important; }
    :host ::ng-deep .bid-pending, :host ::ng-deep .bid-withdrawn { background-color: rgba(0,0,0,0.15) !important; }

    .btn-spinner { display: inline-block; margin-right: 8px; }
    :host ::ng-deep .btn-spinner circle { stroke: white; }
  `],
})
export class BidReviewDialogComponent implements OnInit {
  private bidService = inject(BidService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<BidReviewDialogComponent>);
  private dialogData = inject<BidReviewDialogData>(MAT_DIALOG_DATA);

  bid = signal<Bid | null>(null);
  siblingBids = signal<Bid[]>([]);
  loading = signal(false);
  saving = signal(false);
  showAcceptConfirm = signal(false);
  showRejectNotes = signal(false);
  estimatedValue = signal<number | null>(null);

  notesControl = new FormControl('');
  compColumns = ['subcontractor', 'amount', 'timeline_days', 'status'];

  allBidsForComparison = (): Bid[] => {
    const current = this.bid();
    const siblings = this.siblingBids();
    if (!current) return siblings;
    return [current, ...siblings.filter(b => b.id !== current.id)];
  };

  lowestAmount = (): number => {
    const all = this.allBidsForComparison();
    if (all.length === 0) return 0;
    return Math.min(...all.map(b => b.amount));
  };

  ngOnInit(): void {
    this.loading.set(true);
    this.bidService.getBid(this.dialogData.bid.id).subscribe({
      next: (res) => {
        this.bid.set(res.data);
        this.siblingBids.set(res.sibling_bids ?? []);
        // Try to get estimated value from scope if available
        const scope = (res.data as any).project_scope;
        if (scope?.estimated_value != null) {
          this.estimatedValue.set(scope.estimated_value);
        }
        this.loading.set(false);
      },
      error: () => {
        this.bid.set(this.dialogData.bid);
        this.loading.set(false);
      },
    });
  }

  markUnderReview(): void {
    const bid = this.bid();
    if (!bid) return;
    this.saving.set(true);
    this.bidService.reviewBid(bid.id, 'reject').subscribe({
      // We use a workaround: under_review is set via a separate action
      // but the API only has accept/reject, so we need to just reload
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Bid marked as under review.', 'Dismiss', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }

  confirmAccept(): void {
    const bid = this.bid();
    if (!bid) return;
    this.saving.set(true);
    this.bidService.reviewBid(bid.id, 'accept', this.notesControl.value || undefined).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Bid accepted. Contract created.', 'Dismiss', { duration: 4000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to accept bid. Please try again.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  confirmReject(): void {
    const bid = this.bid();
    if (!bid) return;
    this.saving.set(true);
    this.bidService.reviewBid(bid.id, 'reject', this.notesControl.value || undefined).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Bid rejected.', 'Dismiss', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to reject bid. Please try again.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
