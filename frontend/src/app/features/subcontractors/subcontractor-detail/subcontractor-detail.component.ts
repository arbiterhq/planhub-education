import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { SubcontractorService } from '../../../core/services/subcontractor.service';
import { Subcontractor, SubcontractorBid, SubcontractorContract } from '../../../shared/models/subcontractor.model';
import { getStatusLabel } from '../../../shared/utils/status.utils';
import { BreadcrumbComponent } from '../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-subcontractor-detail',
  standalone: true,
  imports: [
    RouterModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTabsModule,
    BreadcrumbComponent,
  ],
  template: `
    <div class="detail-container">
      @if (loading()) {
        <div class="spinner-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (sub()) {
        <app-breadcrumb [items]="[{ label: 'Subcontractors', link: '/subcontractors' }, { label: sub()!.name }]"></app-breadcrumb>
        <!-- Header -->
        <div class="sub-header">
          <button mat-button routerLink="/subcontractors" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
            Subcontractors
          </button>

          <div class="header-row">
            <div class="header-title">
              <h1>{{ sub()!.name }}</h1>
              @if (sub()!.trades && sub()!.trades!.length > 0) {
                <mat-chip-set class="trade-chips">
                  @for (trade of sub()!.trades!; track trade.id) {
                    <mat-chip>{{ trade.name }}</mat-chip>
                  }
                </mat-chip-set>
              }
              @if (sub()!.city) {
                <p class="address-line">
                  <mat-icon class="inline-icon">location_on</mat-icon>
                  {{ sub()!.address ? sub()!.address + ', ' : '' }}{{ sub()!.city }}, {{ sub()!.state }} {{ sub()!.zip }}
                </p>
              }
              <div class="contact-row">
                @if (sub()!.phone) {
                  <span class="contact-item">
                    <mat-icon class="inline-icon">phone</mat-icon>{{ sub()!.phone }}
                  </span>
                }
                @if (sub()!.email) {
                  <span class="contact-item">
                    <mat-icon class="inline-icon">email</mat-icon>{{ sub()!.email }}
                  </span>
                }
                @if (sub()!.website) {
                  <span class="contact-item">
                    <mat-icon class="inline-icon">language</mat-icon>{{ sub()!.website }}
                  </span>
                }
              </div>
              <div class="meta-row">
                @if (sub()!.established_year) {
                  <span class="meta-item">Est. {{ sub()!.established_year }}</span>
                }
                @if (sub()!.employee_count) {
                  <span class="meta-item">{{ sub()!.employee_count }} employees</span>
                }
                @if (sub()!.license_number) {
                  <span class="meta-item">License: {{ sub()!.license_number }}</span>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="stats-row">
          <mat-card appearance="outlined" class="stat-card">
            <mat-card-content>
              <div class="stat-value">{{ sub()!.total_bids ?? 0 }}</div>
              <div class="stat-label">Total Bids</div>
            </mat-card-content>
          </mat-card>
          <mat-card appearance="outlined" class="stat-card">
            <mat-card-content>
              <div class="stat-value">{{ sub()!.win_rate != null ? sub()!.win_rate + '%' : '—' }}</div>
              <div class="stat-label">Win Rate</div>
            </mat-card-content>
          </mat-card>
          <mat-card appearance="outlined" class="stat-card">
            <mat-card-content>
              <div class="stat-value">{{ sub()!.active_contracts_count ?? 0 }}</div>
              <div class="stat-label">Active Contracts</div>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-divider></mat-divider>

        <!-- Tabs -->
        <mat-tab-group animationDuration="200ms" class="detail-tabs">

          <!-- Tab 1: Bid History -->
          <mat-tab label="Bid History">
            <div class="tab-content">
              <mat-table [dataSource]="sortedBids()" class="mat-elevation-z2">

                <ng-container matColumnDef="project">
                  <mat-header-cell *matHeaderCellDef>Project</mat-header-cell>
                  <mat-cell *matCellDef="let b">
                    @if (b.project_scope?.project) {
                      <a class="project-link" (click)="navigateToProject(b.project_scope.project.id); $event.stopPropagation()">
                        {{ b.project_scope.project.name }}
                      </a>
                    } @else {
                      —
                    }
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="trade">
                  <mat-header-cell *matHeaderCellDef>Trade / Scope</mat-header-cell>
                  <mat-cell *matCellDef="let b">{{ b.project_scope?.trade?.name || '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="amount">
                  <mat-header-cell *matHeaderCellDef>Amount</mat-header-cell>
                  <mat-cell *matCellDef="let b">{{ b.amount | currency:'USD':'symbol':'1.0-0' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="timeline">
                  <mat-header-cell *matHeaderCellDef>Timeline</mat-header-cell>
                  <mat-cell *matCellDef="let b">{{ b.timeline_days ? b.timeline_days + ' days' : '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="status">
                  <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
                  <mat-cell *matCellDef="let b">
                    <mat-chip-set>
                      <mat-chip class="status-chip" [class]="'bid-status-' + b.status">
                        {{ getStatusLabel(b.status) }}
                      </mat-chip>
                    </mat-chip-set>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="submitted_at">
                  <mat-header-cell *matHeaderCellDef>Submitted</mat-header-cell>
                  <mat-cell *matCellDef="let b">
                    {{ b.submitted_at ? (b.submitted_at | date:'mediumDate') : '—' }}
                  </mat-cell>
                </ng-container>

                <mat-header-row *matHeaderRowDef="bidColumns"></mat-header-row>
                <mat-row *matRowDef="let row; columns: bidColumns"></mat-row>
              </mat-table>

              @if (!sub()!.bids || sub()!.bids!.length === 0) {
                <p class="empty-tab">No bids on record.</p>
              }
            </div>
          </mat-tab>

          <!-- Tab 2: Active Contracts -->
          <mat-tab label="Active Contracts">
            <div class="tab-content">
              <mat-table [dataSource]="activeContracts()" class="mat-elevation-z2">

                <ng-container matColumnDef="project">
                  <mat-header-cell *matHeaderCellDef>Project</mat-header-cell>
                  <mat-cell *matCellDef="let c">
                    @if (c.project) {
                      <a class="project-link" (click)="navigateToProject(c.project.id); $event.stopPropagation()">
                        {{ c.project.name }}
                      </a>
                    } @else {
                      —
                    }
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="trade">
                  <mat-header-cell *matHeaderCellDef>Trade</mat-header-cell>
                  <mat-cell *matCellDef="let c">{{ c.trade?.name || '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="amount">
                  <mat-header-cell *matHeaderCellDef>Amount</mat-header-cell>
                  <mat-cell *matCellDef="let c">{{ c.amount | currency:'USD':'symbol':'1.0-0' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="status">
                  <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
                  <mat-cell *matCellDef="let c">
                    <mat-chip-set>
                      <mat-chip class="status-chip" [class]="'contract-status-' + c.status">
                        {{ getStatusLabel(c.status) }}
                      </mat-chip>
                    </mat-chip-set>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="start_date">
                  <mat-header-cell *matHeaderCellDef>Start</mat-header-cell>
                  <mat-cell *matCellDef="let c">{{ c.start_date ? (c.start_date | date:'mediumDate') : '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="end_date">
                  <mat-header-cell *matHeaderCellDef>End</mat-header-cell>
                  <mat-cell *matCellDef="let c">{{ c.end_date ? (c.end_date | date:'mediumDate') : '—' }}</mat-cell>
                </ng-container>

                <mat-header-row *matHeaderRowDef="contractColumns"></mat-header-row>
                <mat-row *matRowDef="let row; columns: contractColumns"></mat-row>
              </mat-table>

              @if (activeContracts().length === 0) {
                <p class="empty-tab">No active contracts.</p>
              }
            </div>
          </mat-tab>

          <!-- Tab 3: Contact Info -->
          <mat-tab label="Contact Info">
            <div class="tab-content">
              <mat-card appearance="outlined">
                <mat-card-header><mat-card-title>Company Details</mat-card-title></mat-card-header>
                <mat-card-content>
                  @if (sub()!.description) {
                    <p class="description-text">{{ sub()!.description }}</p>
                    <mat-divider class="section-divider"></mat-divider>
                  }
                  <dl class="detail-list">
                    <dt>Address</dt>
                    <dd>
                      @if (sub()!.address) {
                        <mat-icon class="inline-icon">place</mat-icon>
                        {{ sub()!.address }}, {{ sub()!.city }}, {{ sub()!.state }} {{ sub()!.zip }}
                      } @else {
                        —
                      }
                    </dd>
                    <dt>Phone</dt>
                    <dd>
                      @if (sub()!.phone) {
                        <mat-icon class="inline-icon">phone</mat-icon>{{ sub()!.phone }}
                      } @else { — }
                    </dd>
                    <dt>Email</dt>
                    <dd>
                      @if (sub()!.email) {
                        <mat-icon class="inline-icon">email</mat-icon>{{ sub()!.email }}
                      } @else { — }
                    </dd>
                    <dt>Website</dt>
                    <dd>
                      @if (sub()!.website) {
                        <mat-icon class="inline-icon">language</mat-icon>{{ sub()!.website }}
                      } @else { — }
                    </dd>
                    <dt>Established</dt>
                    <dd>{{ sub()!.established_year || '—' }}</dd>
                    <dt>Employees</dt>
                    <dd>{{ sub()!.employee_count || '—' }}</dd>
                    <dt>License</dt>
                    <dd>{{ sub()!.license_number || '—' }}</dd>
                  </dl>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .detail-container { padding: 24px; max-width: 1200px; }

    .spinner-container { display: flex; justify-content: center; padding: 64px 0; }

    .back-btn { margin-bottom: 8px; }

    .header-row { margin-bottom: 16px; }
    .header-title h1 { margin: 0 0 8px; font-size: 28px; font-weight: 500; }

    .trade-chips { margin-bottom: 8px; }

    .address-line {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 4px 0;
      color: rgba(0,0,0,0.54);
      font-size: 14px;
    }

    .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin: 8px 0;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: rgba(0,0,0,0.7);
    }

    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 8px;
    }
    .meta-item {
      font-size: 13px;
      color: rgba(0,0,0,0.54);
      background: rgba(0,0,0,0.06);
      padding: 2px 10px;
      border-radius: 12px;
    }

    .inline-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; }

    /* Stats Row */
    .stats-row {
      display: flex;
      gap: 16px;
      margin: 20px 0;
    }
    .stat-card { flex: 1; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 600; color: #1976d2; }
    .stat-label { font-size: 12px; color: rgba(0,0,0,0.54); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

    mat-divider { margin-bottom: 0; }

    /* Tabs */
    .detail-tabs { margin-top: 16px; }
    .tab-content { padding: 24px 0; }

    mat-table { width: 100%; }

    .project-link {
      color: #1976d2;
      cursor: pointer;
      text-decoration: underline;
      text-decoration-color: transparent;
      transition: text-decoration-color 0.1s;
    }
    .project-link:hover { text-decoration-color: #1976d2; }

    .empty-tab {
      text-align: center;
      padding: 32px;
      color: rgba(0,0,0,0.4);
    }

    /* Contact tab */
    .description-text { white-space: pre-wrap; margin: 0 0 16px; }
    .section-divider { margin: 0 0 16px; }
    .detail-list { display: grid; grid-template-columns: auto 1fr; gap: 10px 16px; margin: 0; }
    .detail-list dt { font-weight: 500; color: rgba(0,0,0,0.7); white-space: nowrap; }
    .detail-list dd { margin: 0; display: flex; align-items: center; gap: 4px; }

    /* Bid status chips */
    :host ::ng-deep .status-chip.bid-status-pending     { background-color: #9e9e9e !important; color: #fff !important; }
    :host ::ng-deep .status-chip.bid-status-submitted   { background-color: #1976d2 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.bid-status-under_review { background-color: #f57c00 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.bid-status-accepted    { background-color: #388e3c !important; color: #fff !important; }
    :host ::ng-deep .status-chip.bid-status-rejected    { background-color: #c62828 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.bid-status-withdrawn   { background-color: #616161 !important; color: #fff !important; }

    /* Contract status chips */
    :host ::ng-deep .status-chip.contract-status-draft     { background-color: #9e9e9e !important; color: #fff !important; }
    :host ::ng-deep .status-chip.contract-status-pending   { background-color: #f57c00 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.contract-status-active    { background-color: #388e3c !important; color: #fff !important; }
    :host ::ng-deep .status-chip.contract-status-completed { background-color: #00796b !important; color: #fff !important; }
    :host ::ng-deep .status-chip.contract-status-terminated { background-color: #c62828 !important; color: #fff !important; }

    @media (max-width: 768px) {
      .stats-row { flex-direction: column; }
      .contact-row { flex-direction: column; gap: 8px; }
    }
  `],
})
export class SubcontractorDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subcontractorService = inject(SubcontractorService);

  sub = signal<Subcontractor | null>(null);
  loading = signal(true);

  readonly getStatusLabel = getStatusLabel;
  readonly bidColumns = ['project', 'trade', 'amount', 'timeline', 'status', 'submitted_at'];
  readonly contractColumns = ['project', 'trade', 'amount', 'status', 'start_date', 'end_date'];

  sortedBids(): SubcontractorBid[] {
    const bids = this.sub()?.bids ?? [];
    return [...bids].sort((a, b) => {
      const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  activeContracts(): SubcontractorContract[] {
    return (this.sub()?.contracts ?? []).filter(c => c.status === 'active');
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.subcontractorService.getSubcontractor(id).subscribe({
      next: (res) => { this.sub.set(res.data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/subcontractors']); },
    });
  }

  navigateToProject(projectId: number): void {
    this.router.navigate(['/projects', projectId]);
  }
}
