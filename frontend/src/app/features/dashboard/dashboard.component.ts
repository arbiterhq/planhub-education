import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

// ── Interfaces ───────────────────────────────────────────────────────────────

interface ProjectSummary {
  total: number;
  planning: number;
  bidding: number;
  in_progress: number;
  completed: number;
  on_hold: number;
}

interface BidSummary {
  active_bids: number;
  pending_review: number;
  total_bid_value: number;
}

interface InvoiceSummary {
  open_invoices: number;
  total_outstanding: number;
  paid_this_month: number;
}

interface ActivityEntry {
  id: number;
  action: string;
  description: string;
  created_at: string;
  project: { id: number; name: string } | null;
}

interface DeadlineEntry {
  project_id: number;
  project_name: string;
  bid_due_date: string;
  days_remaining: number;
  open_scopes: number;
}

interface DashboardData {
  project_summary: ProjectSummary;
  bid_summary: BidSummary;
  invoice_summary: InvoiceSummary;
  unread_messages: number;
  recent_activity: ActivityEntry[];
  upcoming_deadlines: DeadlineEntry[];
}

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatListModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatDividerModule,
  ],
  template: `
    @if (isLoading()) {
      <div class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
      </div>
    } @else {
    @if (data(); as d) {
      <!-- KPI Cards -->
      <div class="kpi-grid">

        <mat-card class="kpi-card kpi-projects" routerLink="/projects">
          <mat-card-content>
            <div class="kpi-row">
              <div class="kpi-info">
                <div class="kpi-value">{{ d.project_summary.total }}</div>
                <div class="kpi-label">Projects</div>
                <div class="kpi-detail">
                  {{ d.project_summary.in_progress }} active &bull;
                  {{ d.project_summary.bidding }} bidding
                </div>
              </div>
              <mat-icon class="kpi-icon">business</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card kpi-bids" routerLink="/bids">
          <mat-card-content>
            <div class="kpi-row">
              <div class="kpi-info">
                <div class="kpi-value">{{ d.bid_summary.pending_review }}</div>
                <div class="kpi-label">Active Bids</div>
                <div class="kpi-detail">
                  {{ d.bid_summary.active_bids }} total &bull;
                  {{ d.bid_summary.total_bid_value | currency:'USD':'symbol':'1.0-0' }} value
                </div>
              </div>
              <mat-icon class="kpi-icon">gavel</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card kpi-invoices" routerLink="/invoices">
          <mat-card-content>
            <div class="kpi-row">
              <div class="kpi-info">
                <div class="kpi-value">{{ d.invoice_summary.open_invoices }}</div>
                <div class="kpi-label">Open Invoices</div>
                <div class="kpi-detail">
                  {{ d.invoice_summary.total_outstanding | currency:'USD':'symbol':'1.0-0' }} outstanding
                </div>
              </div>
              <mat-icon class="kpi-icon">receipt_long</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card kpi-messages" routerLink="/messages">
          <mat-card-content>
            <div class="kpi-row">
              <div class="kpi-info">
                <div class="kpi-value">{{ d.unread_messages }}</div>
                <div class="kpi-label">Messages</div>
                <div class="kpi-detail">unread</div>
              </div>
              <mat-icon class="kpi-icon">mail</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>

      </div>

      <!-- Activity + Deadlines -->
      <div class="dashboard-body">

        <!-- Recent Activity -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>Recent Activity</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (d.recent_activity.length === 0) {
              <p class="empty-state">No recent activity.</p>
            } @else {
              <mat-list>
                @for (entry of d.recent_activity; track entry.id) {
                  <mat-list-item class="activity-item"
                    (click)="entry.project && navigateTo('/projects/' + entry.project.id)">
                    <mat-icon matListItemIcon [style.color]="getActivityColor(entry.action)">
                      {{ getActivityIcon(entry.action) }}
                    </mat-icon>
                    <span matListItemTitle class="activity-desc">{{ entry.description }}</span>
                    <span matListItemLine class="activity-time">{{ timeAgo(entry.created_at) }}</span>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                }
              </mat-list>
            }
          </mat-card-content>
        </mat-card>

        <!-- Upcoming Bid Deadlines -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>Upcoming Bid Deadlines</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (d.upcoming_deadlines.length === 0) {
              <p class="empty-state">No upcoming deadlines.</p>
            } @else {
              <table mat-table [dataSource]="d.upcoming_deadlines" class="deadlines-table">

                <ng-container matColumnDef="project_name">
                  <th mat-header-cell *matHeaderCellDef>Project</th>
                  <td mat-cell *matCellDef="let row" class="project-name-cell">{{ row.project_name }}</td>
                </ng-container>

                <ng-container matColumnDef="bid_due_date">
                  <th mat-header-cell *matHeaderCellDef>Due Date</th>
                  <td mat-cell *matCellDef="let row">{{ row.bid_due_date | date:'MMM d, y' }}</td>
                </ng-container>

                <ng-container matColumnDef="days_remaining">
                  <th mat-header-cell *matHeaderCellDef>Days Left</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="days-chip" [style.color]="getDaysColor(row.days_remaining)"
                          [style.background-color]="getDaysBg(row.days_remaining)">
                      {{ row.days_remaining }}d
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="open_scopes">
                  <th mat-header-cell *matHeaderCellDef>Scopes</th>
                  <td mat-cell *matCellDef="let row">{{ row.open_scopes }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="deadlineCols"></tr>
                <tr mat-row *matRowDef="let row; columns: deadlineCols;"
                    class="deadline-row"
                    (click)="navigateTo('/projects/' + row.project_id)"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>

      </div>
    }
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }

    /* ── KPI Grid ──────────────────────────────────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 960px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 600px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }

    .kpi-card {
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.15s;
      border-left: 4px solid transparent;
    }

    .kpi-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .kpi-projects { border-left-color: #1565C0; }
    .kpi-bids     { border-left-color: #F57C00; }
    .kpi-invoices { border-left-color: #4CAF50; }
    .kpi-messages { border-left-color: #9C27B0; }

    .kpi-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .kpi-value {
      font-size: 36px;
      font-weight: 700;
      line-height: 1;
      color: #212121;
    }

    .kpi-label {
      font-size: 14px;
      font-weight: 600;
      color: #616161;
      margin: 4px 0 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-detail {
      font-size: 12px;
      color: #9E9E9E;
    }

    .kpi-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      opacity: 0.18;
    }

    .kpi-projects .kpi-icon { color: #1565C0; }
    .kpi-bids     .kpi-icon { color: #F57C00; }
    .kpi-invoices .kpi-icon { color: #4CAF50; }
    .kpi-messages .kpi-icon { color: #9C27B0; }

    /* ── Dashboard Body ────────────────────────────────────────────────────── */
    .dashboard-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    @media (max-width: 960px) {
      .dashboard-body { grid-template-columns: 1fr; }
    }

    .section-card {
      height: fit-content;
    }

    .empty-state {
      color: #9E9E9E;
      text-align: center;
      padding: 24px 0;
    }

    /* ── Activity List ─────────────────────────────────────────────────────── */
    .activity-item {
      cursor: pointer;
      height: auto !important;
      padding: 12px 0 !important;
    }

    .activity-desc {
      font-size: 13px;
      line-height: 1.4;
      white-space: normal !important;
    }

    .activity-time {
      font-size: 11px;
      color: #9E9E9E;
    }

    /* ── Deadlines Table ───────────────────────────────────────────────────── */
    .deadlines-table {
      width: 100%;
    }

    .deadline-row {
      cursor: pointer;
    }

    .deadline-row:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .project-name-cell {
      font-size: 13px;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .days-chip {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }
  `],
})
export class DashboardComponent implements OnInit {
  private http    = inject(HttpClient);
  private router  = inject(Router);

  data      = signal<DashboardData | null>(null);
  isLoading = signal(true);

  deadlineCols = ['project_name', 'bid_due_date', 'days_remaining', 'open_scopes'];

  ngOnInit(): void {
    this.http.get<DashboardData>('/api/dashboard').subscribe({
      next:  (d) => { this.data.set(d); this.isLoading.set(false); },
      error: ()  => this.isLoading.set(false),
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  getActivityIcon(action: string): string {
    const map: Record<string, string> = {
      project_created:   'add_business',
      project_updated:   'edit',
      itb_sent:          'send',
      itb_bulk_sent:     'send',
      bid_submitted:     'gavel',
      bid_accepted:      'check_circle',
      bid_rejected:      'cancel',
      invoice_submitted: 'receipt_long',
      invoice_approved:  'thumb_up',
      invoice_rejected:  'thumb_down',
      invoice_paid:      'paid',
      message_sent:      'mail',
    };
    return map[action] ?? 'info';
  }

  getActivityColor(action: string): string {
    if (action.includes('rejected')) return '#D32F2F';
    if (action.includes('accepted') || action.includes('paid')) return '#2E7D32';
    if (action.includes('message')) return '#1565C0';
    return '#F57C00';
  }

  timeAgo(dateStr: string): string {
    const diffMs   = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 60)  return `${diffMins}m ago`;
    const diffHrs  = Math.floor(diffMins / 60);
    if (diffHrs  < 24)  return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }

  getDaysColor(days: number): string {
    if (days < 7)  return '#C62828';
    if (days < 14) return '#E65100';
    return '#2E7D32';
  }

  getDaysBg(days: number): string {
    if (days < 7)  return '#FFEBEE';
    if (days < 14) return '#FFF3E0';
    return '#E8F5E9';
  }
}
