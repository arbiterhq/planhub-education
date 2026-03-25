import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest, debounceTime, startWith, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SubcontractorService } from '../../../core/services/subcontractor.service';
import { TradeService } from '../../../core/services/trade.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Subcontractor } from '../../../shared/models/subcontractor.model';
import { Trade } from '../../../shared/models/project.model';
import { SubcontractorFormDialogComponent } from '../subcontractor-form-dialog/subcontractor-form-dialog.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-subcontractor-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
  ],
  template: `
    <div class="page-container">
      <!-- Filter Bar -->
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search subcontractors</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="searchControl" placeholder="Search by name…">
        </mat-form-field>

        <mat-form-field appearance="outline" class="trade-field">
          <mat-label>Trade</mat-label>
          <mat-select [formControl]="tradeControl">
            <mat-option [value]="null">All Trades</mat-option>
            @for (trade of trades(); track trade.id) {
              <mat-option [value]="trade.id">{{ trade.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button mat-raised-button color="primary" (click)="openAddDialog()">
          <mat-icon>add</mat-icon>
          Add Subcontractor
        </button>
      </div>

      @if (loading()) {
        <div class="spinner-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (subcontractors().length === 0) {
        <div class="empty-state">
          <mat-icon>business</mat-icon>
          <p>No subcontractors found.</p>
        </div>
      } @else {
        <div class="card-grid">
          @for (sub of subcontractors(); track sub.id) {
            <mat-card class="sub-card" (click)="navigateToDetail(sub)" appearance="outlined">
              <mat-card-header>
                <mat-card-title>{{ sub.name }}</mat-card-title>
                @if (sub.city) {
                  <mat-card-subtitle>
                    <mat-icon class="location-icon">location_on</mat-icon>
                    {{ sub.city }}, {{ sub.state }}
                  </mat-card-subtitle>
                }
              </mat-card-header>

              <mat-card-content>
                @if (sub.trades && sub.trades.length > 0) {
                  <mat-chip-set class="trade-chips">
                    @for (trade of sub.trades.slice(0, 3); track trade.id) {
                      <mat-chip>{{ trade.name }}</mat-chip>
                    }
                    @if (sub.trades.length > 3) {
                      <mat-chip>+{{ sub.trades.length - 3 }} more</mat-chip>
                    }
                  </mat-chip-set>
                }

                @if (sub.employee_count) {
                  <div class="employee-row">
                    <mat-icon class="meta-icon">people</mat-icon>
                    <span>{{ sub.employee_count }} employees</span>
                  </div>
                }

                <div class="stats-row">
                  <div class="stat-item">
                    <span class="stat-value">{{ sub.total_bids ?? 0 }}</span>
                    <span class="stat-label">Bids</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-item">
                    <span class="stat-value">{{ sub.win_rate != null ? sub.win_rate + '%' : '—' }}</span>
                    <span class="stat-label">Win Rate</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-item">
                    <span class="stat-value">{{ sub.active_contracts_count ?? 0 }}</span>
                    <span class="stat-label">Active Contracts</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <mat-paginator
          [length]="totalItems()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[12, 24, 48]"
          (page)="onPageChange($event)"
          showFirstLastButtons
        ></mat-paginator>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }

    .filter-bar {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 220px; }
    .trade-field { width: 200px; }
    .filter-bar button { margin-top: 4px; }

    .spinner-container { display: flex; justify-content: center; padding: 64px 0; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 0;
      color: rgba(0,0,0,0.4);
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 16px;
    }

    @media (max-width: 1024px) {
      .card-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .card-grid { grid-template-columns: 1fr; }
    }

    .sub-card {
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.1s;
    }
    .sub-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
      transform: translateY(-2px);
    }

    mat-card-subtitle {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-top: 4px;
    }
    .location-icon { font-size: 14px; width: 14px; height: 14px; }

    .trade-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin: 8px 0;
    }
    :host ::ng-deep .trade-chips .mat-mdc-chip { font-size: 11px; height: 24px; }

    .employee-row {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: rgba(0,0,0,0.6);
      margin: 6px 0 12px;
    }
    .meta-icon { font-size: 16px; width: 16px; height: 16px; }

    .stats-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(0,0,0,0.08);
      margin-top: 4px;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }
    .stat-value { font-size: 16px; font-weight: 600; color: #1976d2; }
    .stat-label { font-size: 10px; color: rgba(0,0,0,0.5); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .stat-divider { width: 1px; height: 32px; background: rgba(0,0,0,0.08); }
  `],
})
export class SubcontractorListComponent implements OnInit, OnDestroy {
  private subcontractorService = inject(SubcontractorService);
  private tradeService = inject(TradeService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private notifications = inject(NotificationService);
  private title = inject(Title);

  subcontractors = signal<Subcontractor[]>([]);
  trades = signal<Trade[]>([]);
  loading = signal(false);
  totalItems = signal(0);

  searchControl = new FormControl('');
  tradeControl = new FormControl<number | null>(null);

  pageSize = 12;
  pageIndex = 0;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.title.setTitle('PlanHub — Subcontractors');
    this.tradeService.getTrades().subscribe(res => this.trades.set(res.data));

    combineLatest([
      this.searchControl.valueChanges.pipe(debounceTime(300), startWith(this.searchControl.value)),
      this.tradeControl.valueChanges.pipe(startWith(this.tradeControl.value)),
    ]).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.pageIndex = 0;
      this.loadSubcontractors();
    });
  }

  loadSubcontractors(): void {
    this.loading.set(true);
    this.subcontractorService.getSubcontractors({
      search: this.searchControl.value || undefined,
      trade_id: this.tradeControl.value ?? undefined,
      page: this.pageIndex + 1,
      per_page: this.pageSize,
    }).subscribe({
      next: (res) => {
        this.subcontractors.set(res.data);
        this.totalItems.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  navigateToDetail(sub: Subcontractor): void {
    this.router.navigate(['/subcontractors', sub.id]);
  }

  openAddDialog(): void {
    this.dialog.open(SubcontractorFormDialogComponent, { width: '640px', data: null })
      .afterClosed().subscribe(result => {
        if (result) {
          this.loadSubcontractors();
          this.notifications.success('Subcontractor added to directory');
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadSubcontractors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
