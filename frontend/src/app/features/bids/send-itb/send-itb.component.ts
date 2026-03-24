import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { ProjectService } from '../../../core/services/project.service';
import { SubcontractorService } from '../../../core/services/subcontractor.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { Project, ProjectScope } from '../../../shared/models/project.model';
import { Subcontractor } from '../../../shared/models/subcontractor.model';

@Component({
  selector: 'app-send-itb',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatStepperModule,
    BreadcrumbComponent,
  ],
  template: `
    <div class="page-container">
      <app-breadcrumb [items]="[{ label: 'Bids', link: '/bids' }, { label: 'Send Invitations' }]"></app-breadcrumb>
      <div class="page-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Send Invitations to Bid</h1>
      </div>

      <mat-stepper [linear]="true" #stepper class="stepper">

        <!-- Step 1: Select Project & Scope -->
        <mat-step [stepControl]="step1Form" label="Select Project & Scope">
          <form [formGroup]="step1Form" class="step-content">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Project</mat-label>
              <mat-select formControlName="project_id" (selectionChange)="onProjectChange($event.value)">
                @for (project of projects(); track project.id) {
                  <mat-option [value]="project.id">{{ project.name }}</mat-option>
                }
              </mat-select>
              @if (step1Form.get('project_id')?.hasError('required') && step1Form.get('project_id')?.touched) {
                <mat-error>Project is required</mat-error>
              }
            </mat-form-field>

            @if (loadingScopes()) {
              <mat-spinner diameter="32"></mat-spinner>
            } @else if (step1Form.get('project_id')?.value) {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Scope / Trade</mat-label>
                <mat-select formControlName="scope_id" (selectionChange)="onScopeChange($event.value)">
                  @for (scope of availableScopes(); track scope.id) {
                    <mat-option [value]="scope.id">
                      {{ scope.trade?.name }} — {{ scope.estimated_value | currency }}
                    </mat-option>
                  }
                </mat-select>
                @if (step1Form.get('scope_id')?.hasError('required') && step1Form.get('scope_id')?.touched) {
                  <mat-error>Scope is required</mat-error>
                }
              </mat-form-field>

              @if (selectedScope()) {
                <mat-card appearance="outlined" class="scope-detail-card">
                  <mat-card-content>
                    <div class="scope-detail-row">
                      <span class="detail-label">Trade</span>
                      <span>{{ selectedScope()!.trade?.name }}</span>
                    </div>
                    @if (selectedScope()!.description) {
                      <div class="scope-detail-row">
                        <span class="detail-label">Description</span>
                        <span>{{ selectedScope()!.description }}</span>
                      </div>
                    }
                    <div class="scope-detail-row">
                      <span class="detail-label">Estimated Value</span>
                      <span class="scope-value">{{ selectedScope()!.estimated_value | currency }}</span>
                    </div>
                    <div class="scope-detail-row">
                      <span class="detail-label">Status</span>
                      <mat-chip>{{ selectedScope()!.status }}</mat-chip>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            }

            <div class="step-actions">
              <button mat-raised-button color="primary" matStepperNext
                      [disabled]="step1Form.invalid">
                Next
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Select Subcontractors -->
        <mat-step label="Select Subcontractors">
          <div class="step-content">
            <div class="sub-filter-bar">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search subcontractors</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input matInput [formControl]="subSearchControl" placeholder="Search by name…">
              </mat-form-field>
              <div class="select-buttons">
                <button mat-stroked-button (click)="selectAllSubs()">Select All</button>
                <button mat-stroked-button (click)="deselectAllSubs()">Deselect All</button>
              </div>
            </div>

            @if (loadingSubs()) {
              <div class="spinner-center"><mat-spinner diameter="36"></mat-spinner></div>
            } @else if (filteredSubcontractors().length === 0) {
              <div class="empty-state">
                <mat-icon>business</mat-icon>
                <p>No subcontractors found for this trade.</p>
              </div>
            } @else {
              <mat-selection-list class="sub-list">
                @for (sub of filteredSubcontractors(); track sub.id) {
                  <mat-list-option
                    [value]="sub.id"
                    [selected]="isSubSelected(sub.id)"
                    [disabled]="isAlreadyInvited(sub.id)"
                    (selectedChange)="toggleSub(sub.id, $event)">
                    <div class="sub-list-item">
                      <div class="sub-info">
                        <span class="sub-name">{{ sub.name }}</span>
                        @if (sub.city) {
                          <span class="sub-location">
                            <mat-icon class="tiny-icon">location_on</mat-icon>
                            {{ sub.city }}, {{ sub.state }}
                          </span>
                        }
                      </div>
                      <div class="sub-badges">
                        @if (sub.win_rate != null) {
                          <mat-chip class="win-chip">{{ sub.win_rate }}% wins</mat-chip>
                        }
                        @if (isAlreadyInvited(sub.id)) {
                          <mat-chip class="invited-chip">Already invited</mat-chip>
                        }
                      </div>
                    </div>
                  </mat-list-option>
                }
              </mat-selection-list>

              <p class="selection-count">
                {{ selectedSubIds().length }} subcontractor(s) selected
              </p>
            }

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext
                      [disabled]="selectedSubIds().length === 0">
                Next
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Step 3: Review & Send -->
        <mat-step label="Review & Send">
          <div class="step-content">
            <mat-card appearance="outlined" class="review-card">
              <mat-card-header>
                <mat-card-title>Invitation Summary</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="review-row">
                  <span class="review-label">Project</span>
                  <span>{{ selectedProjectName() }}</span>
                </div>
                @if (selectedScope()) {
                  <div class="review-row">
                    <span class="review-label">Scope</span>
                    <span>{{ selectedScope()!.trade?.name }}</span>
                  </div>
                  <div class="review-row">
                    <span class="review-label">Estimated Value</span>
                    <span>{{ selectedScope()!.estimated_value | currency }}</span>
                  </div>
                }
                <div class="review-row">
                  <span class="review-label">Subcontractors ({{ selectedSubIds().length }})</span>
                  <div class="sub-names-list">
                    @for (id of selectedSubIds(); track id) {
                      <span class="sub-name-tag">{{ getSubName(id) }}</span>
                    }
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-form-field appearance="outline" class="full-width notes-field">
              <mat-label>Notes (optional)</mat-label>
              <textarea matInput [formControl]="notesControl" rows="3"
                        placeholder="Any additional information for the subcontractors…"></textarea>
            </mat-form-field>

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary"
                      [disabled]="sending()"
                      (click)="sendInvitations()">
                @if (sending()) {
                  <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
                }
                Send {{ selectedSubIds().length }} Invitation(s)
              </button>
            </div>
          </div>
        </mat-step>

      </mat-stepper>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 760px; }

    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 500; }

    .stepper { background: transparent; }

    .step-content {
      padding: 20px 0 8px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width { width: 100%; }

    .scope-detail-card { margin-top: 4px; }
    .scope-detail-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 6px 0;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .scope-detail-row:last-child { border-bottom: none; }
    .detail-label { width: 140px; font-size: 13px; color: rgba(0,0,0,0.55); flex-shrink: 0; }
    .scope-value { font-weight: 600; color: #1976d2; font-size: 15px; }

    .sub-filter-bar {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 200px; }
    .select-buttons { display: flex; gap: 8px; padding-top: 4px; }

    .sub-list {
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 4px;
      max-height: 360px;
      overflow-y: auto;
    }

    .sub-list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 12px;
    }
    .sub-info { display: flex; flex-direction: column; }
    .sub-name { font-weight: 500; }
    .sub-location {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      color: rgba(0,0,0,0.55);
      margin-top: 2px;
    }
    .tiny-icon { font-size: 12px; width: 12px; height: 12px; }
    .sub-badges { display: flex; gap: 6px; flex-shrink: 0; }
    .win-chip { font-size: 11px; }
    .invited-chip { font-size: 11px; background: rgba(0,0,0,0.08) !important; }

    .selection-count {
      font-size: 13px;
      color: rgba(0,0,0,0.55);
      margin: 0;
    }

    .review-card { margin-bottom: 8px; }
    .review-row {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .review-row:last-child { border-bottom: none; }
    .review-label { width: 160px; font-size: 13px; color: rgba(0,0,0,0.55); flex-shrink: 0; }
    .sub-names-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .sub-name-tag {
      background: rgba(25, 118, 210, 0.1);
      color: #1565c0;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 13px;
    }

    .notes-field { width: 100%; }

    .step-actions {
      display: flex;
      gap: 12px;
      padding-top: 8px;
    }

    .spinner-center { display: flex; justify-content: center; padding: 32px 0; }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0;
      color: rgba(0,0,0,0.4);
    }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 12px; }

    .btn-spinner { display: inline-block; margin-right: 8px; }
    :host ::ng-deep .btn-spinner circle { stroke: white; }
  `],
})
export class SendItbComponent implements OnInit {
  private projectService = inject(ProjectService);
  private subcontractorService = inject(SubcontractorService);
  private invitationService = inject(InvitationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  projects = signal<Project[]>([]);
  availableScopes = signal<ProjectScope[]>([]);
  subcontractors = signal<Subcontractor[]>([]);
  alreadyInvitedIds = signal<number[]>([]);
  selectedSubIds = signal<number[]>([]);
  loadingScopes = signal(false);
  loadingSubs = signal(false);
  sending = signal(false);

  selectedScope = signal<ProjectScope | null>(null);

  step1Form = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    scope_id: new FormControl<number | null>(null, Validators.required),
  });

  subSearchControl = new FormControl('');
  notesControl = new FormControl('');

  filteredSubcontractors = computed(() => {
    const search = (this.subSearchControl.value || '').toLowerCase();
    if (!search) return this.subcontractors();
    return this.subcontractors().filter(s => s.name.toLowerCase().includes(search));
  });

  selectedProjectName = computed(() => {
    const id = this.step1Form.get('project_id')?.value;
    return this.projects().find(p => p.id === id)?.name ?? '';
  });

  ngOnInit(): void {
    this.projectService.getProjects({ status: 'bidding', per_page: 100 }).subscribe(res => {
      const biddingProjects = res.data;
      this.projectService.getProjects({ status: 'in_progress', per_page: 100 }).subscribe(res2 => {
        this.projects.set([...biddingProjects, ...res2.data]);
      });
    });
  }

  onProjectChange(projectId: number): void {
    this.step1Form.get('scope_id')?.reset();
    this.selectedScope.set(null);
    this.availableScopes.set([]);

    if (!projectId) return;

    this.loadingScopes.set(true);
    this.projectService.getProject(projectId).subscribe(res => {
      const scopes = (res.data.scopes || []).filter(
        s => s.status === 'open' || s.status === 'bidding'
      );
      this.availableScopes.set(scopes);
      this.loadingScopes.set(false);
    });
  }

  onScopeChange(scopeId: number): void {
    const scope = this.availableScopes().find(s => s.id === scopeId) ?? null;
    this.selectedScope.set(scope);
    this.selectedSubIds.set([]);
    this.alreadyInvitedIds.set([]);

    if (!scope?.trade_id) return;

    this.loadingSubs.set(true);
    this.subcontractorService.getSubcontractors({ trade_id: scope.trade_id, per_page: 100 }).subscribe(res => {
      this.subcontractors.set(res.data);
      this.loadingSubs.set(false);
    });

    this.invitationService.getInvitations({ per_page: 100 }).subscribe(res => {
      const scopeInvites = res.data.filter(inv => inv.project_scope_id === scopeId);
      this.alreadyInvitedIds.set(scopeInvites.map(inv => inv.company_id));
    });
  }

  isSubSelected(id: number): boolean {
    return this.selectedSubIds().includes(id);
  }

  isAlreadyInvited(id: number): boolean {
    return this.alreadyInvitedIds().includes(id);
  }

  toggleSub(id: number, selected: boolean): void {
    const current = this.selectedSubIds();
    if (selected) {
      if (!current.includes(id)) this.selectedSubIds.set([...current, id]);
    } else {
      this.selectedSubIds.set(current.filter(x => x !== id));
    }
  }

  selectAllSubs(): void {
    const ids = this.filteredSubcontractors()
      .filter(s => !this.isAlreadyInvited(s.id))
      .map(s => s.id);
    this.selectedSubIds.set(ids);
  }

  deselectAllSubs(): void {
    this.selectedSubIds.set([]);
  }

  getSubName(id: number): string {
    return this.subcontractors().find(s => s.id === id)?.name ?? `#${id}`;
  }

  sendInvitations(): void {
    const scopeId = this.step1Form.get('scope_id')?.value;
    if (!scopeId || this.selectedSubIds().length === 0) return;

    this.sending.set(true);
    this.invitationService.sendBulkInvitations({
      project_scope_id: scopeId,
      company_ids: this.selectedSubIds(),
      notes: this.notesControl.value || undefined,
    }).subscribe({
      next: () => {
        this.sending.set(false);
        this.snackBar.open(
          `${this.selectedSubIds().length} invitation(s) sent successfully.`,
          'Dismiss',
          { duration: 4000 }
        );
        this.router.navigate(['/bids']);
      },
      error: () => {
        this.sending.set(false);
        this.snackBar.open('Failed to send invitations. Please try again.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/bids']);
  }
}
