import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subject, combineLatest, startWith, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BidService } from '../../../core/services/bid.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { ProjectService } from '../../../core/services/project.service';
import { Bid } from '../../../shared/models/bid.model';
import { InvitationToBid } from '../../../shared/models/invitation.model';
import { Project } from '../../../shared/models/project.model';
import { BidReviewDialogComponent } from '../bid-review-dialog/bid-review-dialog.component';
import { SimulateBidDialogComponent } from '../simulate-bid-dialog/simulate-bid-dialog.component';

@Component({
  selector: 'app-bid-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Bidding</h1>
        <div class="header-actions">
          <button mat-stroked-button class="demo-btn" (click)="openSimulateBid()">
            <mat-icon>science</mat-icon>
            Simulate Bid Submission
            <span class="demo-badge">DEMO</span>
          </button>
          <button mat-raised-button color="primary" (click)="router.navigate(['/bids/invite'])">
            <mat-icon>send</mat-icon>
            Send New ITBs
          </button>
        </div>
      </div>

      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">

        <!-- Tab 1: Invitations Sent -->
        <mat-tab label="Invitations Sent">
          <div class="tab-content">
            <div class="filter-bar">
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Project</mat-label>
                <mat-select [formControl]="itbProjectFilter">
                  <mat-option [value]="null">All Projects</mat-option>
                  @for (p of projects(); track p.id) {
                    <mat-option [value]="p.id">{{ p.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Status</mat-label>
                <mat-select [formControl]="itbStatusFilter">
                  <mat-option [value]="null">All Statuses</mat-option>
                  <mat-option value="sent">Sent</mat-option>
                  <mat-option value="viewed">Viewed</mat-option>
                  <mat-option value="bid_submitted">Bid Submitted</mat-option>
                  <mat-option value="declined">Declined</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            @if (loadingItbs()) {
              <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
            } @else {
              <table mat-table [dataSource]="invitations()" class="data-table">
                <ng-container matColumnDef="project">
                  <th mat-header-cell *matHeaderCellDef>Project</th>
                  <td mat-cell *matCellDef="let row">
                    @if (row.project_scope?.project) {
                      <a class="entity-link" [routerLink]="'/projects/' + row.project_scope.project.id">
                        {{ row.project_scope.project.name }}
                      </a>
                    } @else { — }
                  </td>
                </ng-container>

                <ng-container matColumnDef="scope">
                  <th mat-header-cell *matHeaderCellDef>Scope / Trade</th>
                  <td mat-cell *matCellDef="let row">
                    {{ row.project_scope?.trade?.name ?? '—' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="subcontractor">
                  <th mat-header-cell *matHeaderCellDef>Subcontractor</th>
                  <td mat-cell *matCellDef="let row">
                    @if (row.company) {
                      <a class="entity-link" [routerLink]="'/subcontractors/' + row.company.id">{{ row.company.name }}</a>
                    } @else { — }
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-chip [class]="'status-chip itb-' + row.status">
                      {{ itbStatusLabel(row.status) }}
                    </mat-chip>
                  </td>
                </ng-container>

                <ng-container matColumnDef="sent_at">
                  <th mat-header-cell *matHeaderCellDef>Date Sent</th>
                  <td mat-cell *matCellDef="let row">
                    {{ row.sent_at ? (row.sent_at | date:'MMM d, y') : '—' }}
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="itbColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: itbColumns;"></tr>

                @if (invitations().length === 0) {
                  <tr class="no-data-row">
                    <td [attr.colspan]="itbColumns.length" class="no-data-cell">
                      No invitations found.
                    </td>
                  </tr>
                }
              </table>

              <mat-paginator
                [length]="itbTotal()"
                [pageSize]="itbPageSize"
                [pageSizeOptions]="[10, 25, 50]"
                (page)="onItbPageChange($event)"
                showFirstLastButtons
              ></mat-paginator>
            }
          </div>
        </mat-tab>

        <!-- Tab 2: Bids Received -->
        <mat-tab label="Bids Received">
          <div class="tab-content">
            <div class="filter-bar">
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Project</mat-label>
                <mat-select [formControl]="bidProjectFilter">
                  <mat-option [value]="null">All Projects</mat-option>
                  @for (p of projects(); track p.id) {
                    <mat-option [value]="p.id">{{ p.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Status</mat-label>
                <mat-select [formControl]="bidStatusFilter">
                  <mat-option [value]="null">All Statuses</mat-option>
                  <mat-option value="submitted">Submitted</mat-option>
                  <mat-option value="under_review">Under Review</mat-option>
                  <mat-option value="accepted">Accepted</mat-option>
                  <mat-option value="rejected">Rejected</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            @if (loadingBids()) {
              <div class="spinner-container"><mat-spinner diameter="48"></mat-spinner></div>
            } @else {
              <table mat-table [dataSource]="bids()" matSort (matSortChange)="onBidSort($event)" class="data-table">

                <ng-container matColumnDef="project">
                  <th mat-header-cell *matHeaderCellDef>Project</th>
                  <td mat-cell *matCellDef="let row">
                    @if (getBidProjectId(row)) {
                      <a class="entity-link" [routerLink]="'/projects/' + getBidProjectId(row)">
                        {{ getBidProjectName(row) }}
                      </a>
                    } @else { — }
                  </td>
                </ng-container>

                <ng-container matColumnDef="scope">
                  <th mat-header-cell *matHeaderCellDef>Scope / Trade</th>
                  <td mat-cell *matCellDef="let row">
                    {{ getBidTradeName(row) }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="subcontractor">
                  <th mat-header-cell *matHeaderCellDef>Subcontractor</th>
                  <td mat-cell *matCellDef="let row">
                    @if (row.company) {
                      <a class="entity-link" [routerLink]="'/subcontractors/' + row.company.id">{{ row.company.name }}</a>
                    } @else { — }
                  </td>
                </ng-container>

                <ng-container matColumnDef="amount">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header="amount">Amount</th>
                  <td mat-cell *matCellDef="let row" class="amount-cell">
                    {{ row.amount | currency }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="timeline_days">
                  <th mat-header-cell *matHeaderCellDef>Timeline</th>
                  <td mat-cell *matCellDef="let row">
                    {{ row.timeline_days != null ? row.timeline_days + ' days' : '—' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-chip [class]="'status-chip bid-' + row.status">
                      {{ bidStatusLabel(row.status) }}
                    </mat-chip>
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
                  <td mat-cell *matCellDef="let row">
                    @if (row.status === 'submitted' || row.status === 'under_review') {
                      <button mat-stroked-button color="primary" (click)="openReviewDialog(row)">
                        Review
                      </button>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="bidColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: bidColumns;"></tr>

                @if (bids().length === 0) {
                  <tr class="no-data-row">
                    <td [attr.colspan]="bidColumns.length" class="no-data-cell">
                      No bids found.
                    </td>
                  </tr>
                }
              </table>

              <mat-paginator
                [length]="bidTotal()"
                [pageSize]="bidPageSize"
                [pageSizeOptions]="[10, 25, 50]"
                (page)="onBidPageChange($event)"
                showFirstLastButtons
              ></mat-paginator>
            }
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .header-actions { display: flex; gap: 12px; align-items: center; }

    .demo-btn {
      position: relative;
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

    .tab-content { padding: 20px 0; }

    .filter-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .filter-field { width: 200px; }

    .spinner-container { display: flex; justify-content: center; padding: 64px 0; }

    .data-table { width: 100%; }

    .amount-cell { font-weight: 500; }

    .no-data-row td { padding: 32px; text-align: center; color: rgba(0,0,0,0.4); }

    .entity-link {
      color: #1976d2;
      text-decoration: none;
    }
    .entity-link:hover { text-decoration: underline; }

    /* ITB status chips */
    .status-chip { font-size: 12px; }
    :host ::ng-deep .itb-sent { background-color: #1976d2 !important; color: white !important; }
    :host ::ng-deep .itb-viewed { background-color: #f57c00 !important; color: white !important; }
    :host ::ng-deep .itb-bid_submitted { background-color: #388e3c !important; color: white !important; }
    :host ::ng-deep .itb-declined { background-color: #d32f2f !important; color: white !important; }

    /* Bid status chips */
    :host ::ng-deep .bid-submitted { background-color: #1976d2 !important; color: white !important; }
    :host ::ng-deep .bid-under_review { background-color: #f57c00 !important; color: white !important; }
    :host ::ng-deep .bid-accepted { background-color: #388e3c !important; color: white !important; }
    :host ::ng-deep .bid-rejected { background-color: #d32f2f !important; color: white !important; }
    :host ::ng-deep .bid-pending { background-color: rgba(0,0,0,0.2) !important; }
    :host ::ng-deep .bid-withdrawn { background-color: rgba(0,0,0,0.2) !important; }
  `],
})
export class BidListComponent implements OnInit, OnDestroy {
  readonly router = inject(Router);
  private bidService = inject(BidService);
  private invitationService = inject(InvitationService);
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);

  // Data
  invitations = signal<InvitationToBid[]>([]);
  bids = signal<Bid[]>([]);
  projects = signal<Project[]>([]);

  // Loading states
  loadingItbs = signal(false);
  loadingBids = signal(false);

  // Pagination
  itbTotal = signal(0);
  bidTotal = signal(0);
  itbPageSize = 10;
  itbPageIndex = 0;
  bidPageSize = 10;
  bidPageIndex = 0;

  // Sorting
  bidSortField = 'submitted_at';
  bidSortDir = 'desc';

  // Filters
  itbProjectFilter = new FormControl<number | null>(null);
  itbStatusFilter = new FormControl<string | null>(null);
  bidProjectFilter = new FormControl<number | null>(null);
  bidStatusFilter = new FormControl<string | null>(null);

  // Table columns
  itbColumns = ['project', 'scope', 'subcontractor', 'status', 'sent_at'];
  bidColumns = ['project', 'scope', 'subcontractor', 'amount', 'timeline_days', 'status', 'submitted_at', 'actions'];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.projectService.getProjects({ per_page: 100 }).subscribe(res => {
      this.projects.set(res.data);
    });

    combineLatest([
      this.itbProjectFilter.valueChanges.pipe(startWith(null)),
      this.itbStatusFilter.valueChanges.pipe(startWith(null)),
    ]).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.itbPageIndex = 0;
      this.loadInvitations();
    });

    combineLatest([
      this.bidProjectFilter.valueChanges.pipe(startWith(null)),
      this.bidStatusFilter.valueChanges.pipe(startWith(null)),
    ]).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.bidPageIndex = 0;
      this.loadBids();
    });
  }

  loadInvitations(): void {
    this.loadingItbs.set(true);
    this.invitationService.getInvitations({
      project_id: this.itbProjectFilter.value ?? undefined,
      status: this.itbStatusFilter.value ?? undefined,
      page: this.itbPageIndex + 1,
      per_page: this.itbPageSize,
    }).subscribe({
      next: (res) => {
        this.invitations.set(res.data);
        this.itbTotal.set(res.meta.total);
        this.loadingItbs.set(false);
      },
      error: () => this.loadingItbs.set(false),
    });
  }

  loadBids(): void {
    this.loadingBids.set(true);
    this.bidService.getBids({
      project_id: this.bidProjectFilter.value ?? undefined,
      status: this.bidStatusFilter.value ?? undefined,
      sort: this.bidSortField,
      direction: this.bidSortDir,
      page: this.bidPageIndex + 1,
      per_page: this.bidPageSize,
    }).subscribe({
      next: (res) => {
        this.bids.set(res.data);
        this.bidTotal.set(res.meta.total);
        this.loadingBids.set(false);
      },
      error: () => this.loadingBids.set(false),
    });
  }

  onTabChange(index: number): void {
    if (index === 0) this.loadInvitations();
    else if (index === 1) this.loadBids();
  }

  onItbPageChange(event: PageEvent): void {
    this.itbPageIndex = event.pageIndex;
    this.itbPageSize = event.pageSize;
    this.loadInvitations();
  }

  onBidPageChange(event: PageEvent): void {
    this.bidPageIndex = event.pageIndex;
    this.bidPageSize = event.pageSize;
    this.loadBids();
  }

  onBidSort(sort: Sort): void {
    this.bidSortField = sort.active || 'submitted_at';
    this.bidSortDir = sort.direction || 'desc';
    this.bidPageIndex = 0;
    this.loadBids();
  }

  openReviewDialog(bid: Bid): void {
    this.dialog.open(BidReviewDialogComponent, {
      width: '720px',
      data: { bid },
    }).afterClosed().subscribe(changed => {
      if (changed) this.loadBids();
    });
  }

  openSimulateBid(): void {
    this.dialog.open(SimulateBidDialogComponent, {
      width: '560px',
    }).afterClosed().subscribe(created => {
      if (created) this.loadBids();
    });
  }

  getBidProjectId(bid: Bid): number | null {
    const scope = (bid as any).project_scope;
    return scope?.project?.id ?? null;
  }

  getBidProjectName(bid: Bid): string {
    const scope = (bid as any).project_scope;
    return scope?.project?.name ?? '—';
  }

  getBidTradeName(bid: Bid): string {
    const scope = (bid as any).project_scope;
    return scope?.trade?.name ?? '—';
  }

  itbStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      sent: 'Sent',
      viewed: 'Viewed',
      bid_submitted: 'Bid Submitted',
      declined: 'Declined',
    };
    return labels[status] ?? status;
  }

  bidStatusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
