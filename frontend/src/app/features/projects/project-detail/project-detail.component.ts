import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ProjectService } from '../../../core/services/project.service';
import { Bid } from '../../../shared/models/bid.model';
import { Contract } from '../../../shared/models/contract.model';
import { Invoice } from '../../../shared/models/invoice.model';
import { Project, ProjectScope } from '../../../shared/models/project.model';
import { getStatusLabel } from '../../../shared/utils/status.utils';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';
import { ProjectScopeDialogComponent, ScopeDialogData } from '../project-scope-dialog/project-scope-dialog.component';

interface BidRow extends Bid {
  tradeName: string;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTabsModule,
  ],
  template: `
    <div class="detail-container">
      @if (loading()) {
        <div class="spinner-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (project()) {
        <!-- Header -->
        <div class="project-header">
          <button mat-button routerLink="/projects" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
            Projects
          </button>

          <div class="header-row">
            <div class="header-title">
              <h1>{{ project()!.name }}</h1>
              <mat-chip-set>
                <mat-chip class="status-chip" [class]="'status-' + project()!.status">
                  {{ getStatusLabel(project()!.status) }}
                </mat-chip>
              </mat-chip-set>
              @if (project()!.city) {
                <p class="address-line">{{ project()!.city }}, {{ project()!.state }} {{ project()!.zip }}</p>
              }
            </div>
            <button mat-raised-button color="primary" (click)="openEditDialog()">
              <mat-icon>edit</mat-icon>
              Edit Project
            </button>
          </div>

          <!-- Key Stats -->
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">Budget</span>
              <span class="stat-value">
                {{ project()!.estimated_budget ? (project()!.estimated_budget! | currency:'USD':'symbol':'1.0-0') : '—' }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Start Date</span>
              <span class="stat-value">{{ project()!.start_date ? (project()!.start_date! | date:'mediumDate') : '—' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">End Date</span>
              <span class="stat-value">{{ project()!.end_date ? (project()!.end_date! | date:'mediumDate') : '—' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Bid Due</span>
              <span class="stat-value">{{ project()!.bid_due_date ? (project()!.bid_due_date! | date:'mediumDate') : '—' }}</span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Tabs -->
        <mat-tab-group animationDuration="200ms" class="detail-tabs">

          <!-- Tab 1: Overview -->
          <mat-tab label="Overview">
            <div class="tab-content">
              @if (project()!.description) {
                <mat-card appearance="outlined" class="section-card">
                  <mat-card-header><mat-card-title>Description</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <p class="description-text">{{ project()!.description }}</p>
                  </mat-card-content>
                </mat-card>
              }

              <div class="overview-grid">
                <mat-card appearance="outlined">
                  <mat-card-header><mat-card-title>Project Details</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <dl class="detail-list">
                      <dt>Type</dt><dd>{{ project()!.project_type || '—' }}</dd>
                      <dt>Status</dt><dd>{{ getStatusLabel(project()!.status) }}</dd>
                      <dt>Address</dt><dd>{{ project()!.address || '—' }}</dd>
                      <dt>City / State</dt>
                      <dd>{{ project()!.city ? project()!.city + ', ' + project()!.state : '—' }}</dd>
                      <dt>Start Date</dt><dd>{{ project()!.start_date ? (project()!.start_date! | date:'mediumDate') : '—' }}</dd>
                      <dt>End Date</dt><dd>{{ project()!.end_date ? (project()!.end_date! | date:'mediumDate') : '—' }}</dd>
                      <dt>Bid Due Date</dt><dd>{{ project()!.bid_due_date ? (project()!.bid_due_date! | date:'mediumDate') : '—' }}</dd>
                      <dt>Budget</dt>
                      <dd>{{ project()!.estimated_budget ? (project()!.estimated_budget! | currency:'USD':'symbol':'1.0-0') : '—' }}</dd>
                    </dl>
                  </mat-card-content>
                </mat-card>

                <mat-card appearance="outlined">
                  <mat-card-header><mat-card-title>Quick Stats</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <dl class="detail-list">
                      <dt>Total Scopes</dt><dd>{{ project()!.scopes?.length ?? 0 }}</dd>
                      <dt>Active Bids</dt><dd>{{ activeBidsCount() }}</dd>
                      <dt>Active Contracts</dt><dd>{{ activeContractsCount() }}</dd>
                      <dt>Total Invoiced</dt>
                      <dd>{{ totalInvoiced() | currency:'USD':'symbol':'1.0-0' }}</dd>
                    </dl>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 2: Scopes -->
          <mat-tab label="Scopes">
            <div class="tab-content">
              <div class="tab-toolbar">
                <h3>Project Scopes</h3>
                <button mat-raised-button color="primary" (click)="openAddScopeDialog()">
                  <mat-icon>add</mat-icon>
                  Add Scope
                </button>
              </div>

              <mat-table [dataSource]="project()!.scopes || []" class="mat-elevation-z2">
                <ng-container matColumnDef="trade">
                  <mat-header-cell *matHeaderCellDef>Trade</mat-header-cell>
                  <mat-cell *matCellDef="let s">{{ s.trade?.name || '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="description">
                  <mat-header-cell *matHeaderCellDef>Description</mat-header-cell>
                  <mat-cell *matCellDef="let s" class="description-cell">{{ s.description || '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="estimated_value">
                  <mat-header-cell *matHeaderCellDef>Est. Value</mat-header-cell>
                  <mat-cell *matCellDef="let s">{{ s.estimated_value | currency:'USD':'symbol':'1.0-0' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="status">
                  <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
                  <mat-cell *matCellDef="let s">
                    <mat-chip-set>
                      <mat-chip class="status-chip" [class]="'status-' + s.status">
                        {{ getStatusLabel(s.status) }}
                      </mat-chip>
                    </mat-chip-set>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="bids_count">
                  <mat-header-cell *matHeaderCellDef>Bids</mat-header-cell>
                  <mat-cell *matCellDef="let s">{{ s.bids?.length ?? 0 }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="scope_actions">
                  <mat-header-cell *matHeaderCellDef></mat-header-cell>
                  <mat-cell *matCellDef="let s">
                    <button mat-icon-button (click)="openEditScopeDialog(s)" aria-label="Edit scope">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button (click)="deleteScope(s)" aria-label="Delete scope">
                      <mat-icon color="warn">delete</mat-icon>
                    </button>
                  </mat-cell>
                </ng-container>

                <mat-header-row *matHeaderRowDef="scopeColumns"></mat-header-row>
                <mat-row *matRowDef="let row; columns: scopeColumns"></mat-row>
              </mat-table>
            </div>
          </mat-tab>

          <!-- Tab 3: Bids -->
          <mat-tab label="Bids">
            <div class="tab-content">
              <mat-table [dataSource]="allBids()" class="mat-elevation-z2">
                <ng-container matColumnDef="trade">
                  <mat-header-cell *matHeaderCellDef>Trade / Scope</mat-header-cell>
                  <mat-cell *matCellDef="let b">{{ b.tradeName }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="company">
                  <mat-header-cell *matHeaderCellDef>Subcontractor</mat-header-cell>
                  <mat-cell *matCellDef="let b">{{ b.company?.name || '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="amount">
                  <mat-header-cell *matHeaderCellDef>Amount</mat-header-cell>
                  <mat-cell *matCellDef="let b">{{ b.amount | currency:'USD':'symbol':'1.0-0' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="timeline">
                  <mat-header-cell *matHeaderCellDef>Timeline</mat-header-cell>
                  <mat-cell *matCellDef="let b">{{ b.timeline_days ? b.timeline_days + ' days' : '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="bid_status">
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
            </div>
          </mat-tab>

          <!-- Tab 4: Contracts -->
          <mat-tab label="Contracts">
            <div class="tab-content">
              <mat-table [dataSource]="project()!.contracts || []" class="mat-elevation-z2">
                <ng-container matColumnDef="company">
                  <mat-header-cell *matHeaderCellDef>Subcontractor</mat-header-cell>
                  <mat-cell *matCellDef="let c">{{ c.company?.name || '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="trade">
                  <mat-header-cell *matHeaderCellDef>Trade</mat-header-cell>
                  <mat-cell *matCellDef="let c">{{ c.trade?.name || '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="amount">
                  <mat-header-cell *matHeaderCellDef>Amount</mat-header-cell>
                  <mat-cell *matCellDef="let c">{{ c.amount | currency:'USD':'symbol':'1.0-0' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="contract_status">
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
            </div>
          </mat-tab>

          <!-- Tab 5: Invoices -->
          <mat-tab label="Invoices">
            <div class="tab-content">
              <mat-table [dataSource]="project()!.invoices || []" class="mat-elevation-z2">
                <ng-container matColumnDef="invoice_number">
                  <mat-header-cell *matHeaderCellDef>Invoice #</mat-header-cell>
                  <mat-cell *matCellDef="let i">{{ i.invoice_number }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="company">
                  <mat-header-cell *matHeaderCellDef>Subcontractor</mat-header-cell>
                  <mat-cell *matCellDef="let i">{{ i.company?.name || '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="amount">
                  <mat-header-cell *matHeaderCellDef>Amount</mat-header-cell>
                  <mat-cell *matCellDef="let i">{{ i.amount | currency:'USD':'symbol':'1.0-0' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="invoice_status">
                  <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
                  <mat-cell *matCellDef="let i">
                    <mat-chip-set>
                      <mat-chip class="status-chip" [class]="'invoice-status-' + i.status">
                        {{ getStatusLabel(i.status) }}
                      </mat-chip>
                    </mat-chip-set>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="due_date">
                  <mat-header-cell *matHeaderCellDef>Due Date</mat-header-cell>
                  <mat-cell *matCellDef="let i">{{ i.due_date ? (i.due_date | date:'mediumDate') : '—' }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="submitted_at">
                  <mat-header-cell *matHeaderCellDef>Submitted</mat-header-cell>
                  <mat-cell *matCellDef="let i">{{ i.submitted_at ? (i.submitted_at | date:'mediumDate') : '—' }}</mat-cell>
                </ng-container>

                <mat-header-row *matHeaderRowDef="invoiceColumns"></mat-header-row>
                <mat-row *matRowDef="let row; columns: invoiceColumns"></mat-row>
              </mat-table>
            </div>
          </mat-tab>

        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .detail-container { padding: 24px; max-width: 1200px; }

    .spinner-container { display: flex; justify-content: center; padding: 64px 0; }

    /* Header */
    .back-btn { margin-bottom: 8px; }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .header-title h1 { margin: 0 0 8px; font-size: 28px; font-weight: 500; }
    .address-line { margin: 4px 0 0; color: rgba(0,0,0,0.54); font-size: 14px; }

    /* Stats Row */
    .stats-row {
      display: flex;
      gap: 32px;
      margin: 16px 0;
      flex-wrap: wrap;
    }
    .stat-item { display: flex; flex-direction: column; }
    .stat-label { font-size: 12px; color: rgba(0,0,0,0.54); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 16px; font-weight: 500; margin-top: 2px; }

    /* Tabs */
    .detail-tabs { margin-top: 16px; }
    .tab-content { padding: 24px 0; display: flex; flex-direction: column; gap: 16px; }

    .tab-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tab-toolbar h3 { margin: 0; }

    /* Overview layout */
    .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .section-card { margin-bottom: 0; }

    .detail-list { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; margin: 0; }
    .detail-list dt { font-weight: 500; color: rgba(0,0,0,0.7); white-space: nowrap; }
    .detail-list dd { margin: 0; }

    .description-text { white-space: pre-wrap; margin: 0; }
    .description-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    mat-table { width: 100%; }

    /* Status chip colors — project statuses */
    :host ::ng-deep .status-chip.status-planning   { background-color: #9e9e9e !important; color: #fff !important; }
    :host ::ng-deep .status-chip.status-bidding    { background-color: #1976d2 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.status-in_progress { background-color: #388e3c !important; color: #fff !important; }
    :host ::ng-deep .status-chip.status-completed  { background-color: #00796b !important; color: #fff !important; }
    :host ::ng-deep .status-chip.status-on_hold    { background-color: #f57c00 !important; color: #fff !important; }

    /* Scope statuses */
    :host ::ng-deep .status-chip.status-open       { background-color: #9e9e9e !important; color: #fff !important; }
    :host ::ng-deep .status-chip.status-awarded    { background-color: #7b1fa2 !important; color: #fff !important; }

    /* Bid statuses */
    :host ::ng-deep .status-chip.bid-status-pending     { background-color: #9e9e9e !important; color: #fff !important; }
    :host ::ng-deep .status-chip.bid-status-submitted   { background-color: #1976d2 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.bid-status-under_review { background-color: #f57c00 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.bid-status-accepted    { background-color: #388e3c !important; color: #fff !important; }
    :host ::ng-deep .status-chip.bid-status-rejected    { background-color: #c62828 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.bid-status-withdrawn   { background-color: #616161 !important; color: #fff !important; }

    /* Contract statuses */
    :host ::ng-deep .status-chip.contract-status-draft     { background-color: #9e9e9e !important; color: #fff !important; }
    :host ::ng-deep .status-chip.contract-status-pending   { background-color: #f57c00 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.contract-status-active    { background-color: #388e3c !important; color: #fff !important; }
    :host ::ng-deep .status-chip.contract-status-completed { background-color: #00796b !important; color: #fff !important; }
    :host ::ng-deep .status-chip.contract-status-terminated { background-color: #c62828 !important; color: #fff !important; }

    /* Invoice statuses */
    :host ::ng-deep .status-chip.invoice-status-draft      { background-color: #9e9e9e !important; color: #fff !important; }
    :host ::ng-deep .status-chip.invoice-status-submitted  { background-color: #1976d2 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.invoice-status-under_review { background-color: #f57c00 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.invoice-status-approved   { background-color: #388e3c !important; color: #fff !important; }
    :host ::ng-deep .status-chip.invoice-status-paid       { background-color: #00796b !important; color: #fff !important; }
    :host ::ng-deep .status-chip.invoice-status-rejected   { background-color: #c62828 !important; color: #fff !important; }

    @media (max-width: 768px) {
      .overview-grid { grid-template-columns: 1fr; }
      .header-row { flex-direction: column; gap: 16px; }
      .stats-row { gap: 16px; }
    }
  `],
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);

  project = signal<Project | null>(null);
  loading = signal(true);

  readonly getStatusLabel = getStatusLabel;

  readonly scopeColumns = ['trade', 'description', 'estimated_value', 'status', 'bids_count', 'scope_actions'];
  readonly bidColumns = ['trade', 'company', 'amount', 'timeline', 'bid_status', 'submitted_at'];
  readonly contractColumns = ['company', 'trade', 'amount', 'contract_status', 'start_date', 'end_date'];
  readonly invoiceColumns = ['invoice_number', 'company', 'amount', 'invoice_status', 'due_date', 'submitted_at'];

  allBids = computed<BidRow[]>(() =>
    (this.project()?.scopes ?? []).flatMap(scope =>
      (scope.bids ?? []).map(bid => ({
        ...bid,
        tradeName: scope.trade?.name ?? `Scope ${scope.id}`,
      }))
    )
  );

  activeBidsCount = computed(() =>
    (this.project()?.scopes ?? []).flatMap(s => s.bids ?? [])
      .filter(b => b.status === 'submitted' || b.status === 'under_review').length
  );

  activeContractsCount = computed(() =>
    (this.project()?.contracts ?? []).filter(c => c.status === 'active').length
  );

  totalInvoiced = computed(() =>
    (this.project()?.invoices ?? []).reduce((sum, inv) => sum + inv.amount, 0)
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject(id);
  }

  loadProject(id: number): void {
    this.loading.set(true);
    this.projectService.getProject(id).subscribe({
      next: (res) => { this.project.set(res.data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/projects']); },
    });
  }

  openEditDialog(): void {
    this.dialog.open(ProjectFormDialogComponent, { width: '640px', data: this.project() })
      .afterClosed().subscribe(result => {
        if (result) this.loadProject(result.id);
      });
  }

  openAddScopeDialog(): void {
    const data: ScopeDialogData = { projectId: this.project()!.id };
    this.dialog.open(ProjectScopeDialogComponent, { width: '480px', data })
      .afterClosed().subscribe(result => {
        if (result) this.loadProject(this.project()!.id);
      });
  }

  openEditScopeDialog(scope: ProjectScope): void {
    const data: ScopeDialogData = { projectId: this.project()!.id, scope };
    this.dialog.open(ProjectScopeDialogComponent, { width: '480px', data })
      .afterClosed().subscribe(result => {
        if (result) this.loadProject(this.project()!.id);
      });
  }

  deleteScope(scope: ProjectScope): void {
    if (!confirm('Delete this scope? This cannot be undone.')) return;
    this.projectService.deleteScope(this.project()!.id, scope.id)
      .subscribe(() => this.loadProject(this.project()!.id));
  }
}
