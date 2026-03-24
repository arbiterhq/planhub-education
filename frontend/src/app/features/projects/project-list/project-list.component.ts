import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subject, combineLatest, debounceTime, startWith, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../shared/models/project.model';
import { getStatusLabel } from '../../../shared/utils/status.utils';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';

@Component({
  selector: 'app-project-list',
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
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  template: `
    <div class="page-container">
      <!-- Filter Bar -->
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search projects</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="searchControl" placeholder="Search by name…">
        </mat-form-field>

        <mat-form-field appearance="outline" class="status-field">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusControl">
            <mat-option value="">All Statuses</mat-option>
            <mat-option value="planning">Planning</mat-option>
            <mat-option value="bidding">Bidding</mat-option>
            <mat-option value="in_progress">In Progress</mat-option>
            <mat-option value="completed">Completed</mat-option>
            <mat-option value="on_hold">On Hold</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-raised-button color="primary" (click)="openNewProjectDialog()">
          <mat-icon>add</mat-icon>
          New Project
        </button>
      </div>

      @if (loading()) {
        <div class="spinner-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else {
        <mat-table [dataSource]="projects()" class="projects-table mat-elevation-z2">

          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
            <mat-cell *matCellDef="let p">
              <div class="project-name-cell">
                <strong>{{ p.name }}</strong>
                @if (p.city) {
                  <small class="location-hint">{{ p.city }}, {{ p.state }}</small>
                }
              </div>
            </mat-cell>
          </ng-container>

          <!-- Type Column -->
          <ng-container matColumnDef="project_type">
            <mat-header-cell *matHeaderCellDef>Type</mat-header-cell>
            <mat-cell *matCellDef="let p">{{ p.project_type || '—' }}</mat-cell>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
            <mat-cell *matCellDef="let p">
              <mat-chip-set>
                <mat-chip class="status-chip" [class]="'status-' + p.status">
                  {{ getStatusLabel(p.status) }}
                </mat-chip>
              </mat-chip-set>
            </mat-cell>
          </ng-container>

          <!-- Budget Column -->
          <ng-container matColumnDef="estimated_budget">
            <mat-header-cell *matHeaderCellDef>Budget</mat-header-cell>
            <mat-cell *matCellDef="let p">
              {{ p.estimated_budget ? (p.estimated_budget | currency:'USD':'symbol':'1.0-0') : '—' }}
            </mat-cell>
          </ng-container>

          <!-- Bid Due Column -->
          <ng-container matColumnDef="bid_due_date">
            <mat-header-cell *matHeaderCellDef>Bid Due</mat-header-cell>
            <mat-cell *matCellDef="let p">
              {{ p.bid_due_date ? (p.bid_due_date | date:'mediumDate') : '—' }}
            </mat-cell>
          </ng-container>

          <!-- Scopes Column -->
          <ng-container matColumnDef="scopes_count">
            <mat-header-cell *matHeaderCellDef>Scopes</mat-header-cell>
            <mat-cell *matCellDef="let p">{{ p.scopes_count ?? '—' }}</mat-cell>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <mat-header-cell *matHeaderCellDef></mat-header-cell>
            <mat-cell *matCellDef="let p" (click)="$event.stopPropagation()">
              <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Actions">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="navigateToProject(p)">
                  <mat-icon>visibility</mat-icon>
                  <span>View</span>
                </button>
                <button mat-menu-item (click)="openEditDialog(p)">
                  <mat-icon>edit</mat-icon>
                  <span>Edit</span>
                </button>
                <button mat-menu-item (click)="deleteProject(p)">
                  <mat-icon color="warn">delete</mat-icon>
                  <span>Delete</span>
                </button>
              </mat-menu>
            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
          <mat-row
            *matRowDef="let row; columns: displayedColumns"
            class="clickable-row"
            (click)="navigateToProject(row)"
          ></mat-row>
        </mat-table>

        <mat-paginator
          [length]="totalItems()"
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

    .filter-bar {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 200px; }
    .status-field { width: 180px; }
    .filter-bar button { margin-top: 4px; }

    .spinner-container { display: flex; justify-content: center; padding: 64px 0; }

    .projects-table { width: 100%; }

    .project-name-cell { display: flex; flex-direction: column; }
    .location-hint { color: rgba(0,0,0,0.54); font-size: 12px; margin-top: 2px; }

    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(0,0,0,0.04); }

    :host ::ng-deep .status-chip.status-planning   { background-color: #9e9e9e !important; color: #fff !important; }
    :host ::ng-deep .status-chip.status-bidding    { background-color: #1976d2 !important; color: #fff !important; }
    :host ::ng-deep .status-chip.status-in_progress { background-color: #388e3c !important; color: #fff !important; }
    :host ::ng-deep .status-chip.status-completed  { background-color: #00796b !important; color: #fff !important; }
    :host ::ng-deep .status-chip.status-on_hold    { background-color: #f57c00 !important; color: #fff !important; }
  `],
})
export class ProjectListComponent implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  projects = signal<Project[]>([]);
  loading = signal(false);
  totalItems = signal(0);

  searchControl = new FormControl('');
  statusControl = new FormControl('');

  pageSize = 10;
  pageIndex = 0;

  readonly displayedColumns = ['name', 'project_type', 'status', 'estimated_budget', 'bid_due_date', 'scopes_count', 'actions'];
  readonly getStatusLabel = getStatusLabel;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    combineLatest([
      this.searchControl.valueChanges.pipe(debounceTime(300), startWith(this.searchControl.value)),
      this.statusControl.valueChanges.pipe(startWith(this.statusControl.value)),
    ]).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.pageIndex = 0;
      this.loadProjects();
    });
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectService.getProjects({
      search: this.searchControl.value || undefined,
      status: this.statusControl.value || undefined,
      page: this.pageIndex + 1,
      per_page: this.pageSize,
    }).subscribe({
      next: (res) => {
        this.projects.set(res.data);
        this.totalItems.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  navigateToProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  openNewProjectDialog(): void {
    this.dialog.open(ProjectFormDialogComponent, { width: '640px', data: null })
      .afterClosed().subscribe(result => { if (result) this.loadProjects(); });
  }

  openEditDialog(project: Project): void {
    this.dialog.open(ProjectFormDialogComponent, { width: '640px', data: project })
      .afterClosed().subscribe(result => { if (result) this.loadProjects(); });
  }

  deleteProject(project: Project): void {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    this.projectService.deleteProject(project.id).subscribe(() => this.loadProjects());
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
