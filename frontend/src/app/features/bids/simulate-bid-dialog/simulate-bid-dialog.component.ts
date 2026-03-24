import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BidService } from '../../../core/services/bid.service';
import { ProjectService } from '../../../core/services/project.service';
import { SubcontractorService } from '../../../core/services/subcontractor.service';
import { ProjectScope } from '../../../shared/models/project.model';
import { Subcontractor } from '../../../shared/models/subcontractor.model';

export interface SimulateBidDialogData {
  project_scope_id?: number;
}

@Component({
  selector: 'app-simulate-bid-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="demo-icon">science</mat-icon>
      Simulate Bid Submission
      <span class="demo-badge">DEMO</span>
    </h2>

    <mat-dialog-content>
      <p class="demo-note">
        This simulates a subcontractor submitting a bid. In production, subcontractors
        would submit bids via their own portal.
      </p>

      <form [formGroup]="form" class="form-content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Scope</mat-label>
          <mat-select formControlName="project_scope_id" (selectionChange)="onScopeChange($event.value)">
            @for (scope of allScopes(); track scope.id) {
              <mat-option [value]="scope.id">
                {{ scope.projectName }} — {{ scope.trade?.name }}
              </mat-option>
            }
          </mat-select>
          @if (form.get('project_scope_id')?.hasError('required') && form.get('project_scope_id')?.touched) {
            <mat-error>Scope is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Subcontractor</mat-label>
          <mat-select formControlName="company_id">
            @for (sub of subcontractors(); track sub.id) {
              <mat-option [value]="sub.company_id ?? sub.id">{{ sub.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('company_id')?.hasError('required') && form.get('company_id')?.touched) {
            <mat-error>Subcontractor is required</mat-error>
          }
        </mat-form-field>

        <div class="two-col">
          <mat-form-field appearance="outline">
            <mat-label>Bid Amount ($)</mat-label>
            <input matInput type="number" formControlName="amount" min="0" step="1000">
            @if (form.get('amount')?.hasError('required') && form.get('amount')?.touched) {
              <mat-error>Amount is required</mat-error>
            }
            @if (form.get('amount')?.hasError('min')) {
              <mat-error>Amount must be positive</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Timeline (days)</mat-label>
            <input matInput type="number" formControlName="timeline_days" min="1">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description / Notes</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    placeholder="Optional notes from the subcontractor…"></textarea>
        </mat-form-field>
      </form>

      @if (loadingScopes()) {
        <p class="loading-note">Loading scopes…</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary"
              [disabled]="form.invalid || saving()"
              (click)="submit()">
        @if (saving()) { <mat-spinner diameter="18" class="btn-spinner"></mat-spinner> }
        Submit Bid
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .demo-icon { color: #5c6bc0; }
    .demo-badge {
      font-size: 9px;
      background: #5c6bc0;
      color: white;
      border-radius: 3px;
      padding: 1px 4px;
      margin-left: 4px;
      vertical-align: middle;
      font-weight: 600;
    }

    .demo-note {
      font-size: 13px;
      color: rgba(0,0,0,0.55);
      background: rgba(92, 107, 192, 0.08);
      border-left: 3px solid #5c6bc0;
      padding: 8px 12px;
      border-radius: 0 4px 4px 0;
      margin-bottom: 16px;
    }

    .form-content { display: flex; flex-direction: column; gap: 0; }
    .full-width { width: 100%; }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .loading-note { font-size: 13px; color: rgba(0,0,0,0.45); }

    mat-dialog-content { min-width: 440px; }

    .btn-spinner { display: inline-block; margin-right: 8px; }
    :host ::ng-deep .btn-spinner circle { stroke: white; }
  `],
})
export class SimulateBidDialogComponent implements OnInit {
  private bidService = inject(BidService);
  private projectService = inject(ProjectService);
  private subcontractorService = inject(SubcontractorService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<SimulateBidDialogComponent>);
  private dialogData = inject<SimulateBidDialogData>(MAT_DIALOG_DATA, { optional: true });

  allScopes = signal<(ProjectScope & { projectName: string })[]>([]);
  subcontractors = signal<(Subcontractor & { company_id?: number })[]>([]);
  loadingScopes = signal(false);
  saving = signal(false);

  form = new FormGroup({
    project_scope_id: new FormControl<number | null>(null, Validators.required),
    company_id: new FormControl<number | null>(null, Validators.required),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    timeline_days: new FormControl<number | null>(null),
    description: new FormControl(''),
  });

  ngOnInit(): void {
    this.loadingScopes.set(true);
    this.projectService.getProjects({ per_page: 100 }).subscribe(res => {
      const scopePromises: (ProjectScope & { projectName: string })[] = [];
      const projects = res.data;
      let pending = projects.length;

      if (pending === 0) {
        this.allScopes.set([]);
        this.loadingScopes.set(false);
        return;
      }

      for (const project of projects) {
        this.projectService.getProject(project.id).subscribe(detail => {
          for (const scope of detail.data.scopes ?? []) {
            if (scope.status === 'open' || scope.status === 'bidding') {
              scopePromises.push({ ...scope, projectName: project.name });
            }
          }
          pending--;
          if (pending === 0) {
            this.allScopes.set(scopePromises);
            this.loadingScopes.set(false);

            // Pre-select if data passed in
            if (this.dialogData?.project_scope_id) {
              this.form.get('project_scope_id')?.setValue(this.dialogData.project_scope_id);
              this.onScopeChange(this.dialogData.project_scope_id);
            }
          }
        });
      }
    });

    // Load all subcontractors
    this.subcontractorService.getSubcontractors({ per_page: 100 }).subscribe(res => {
      this.subcontractors.set(res.data);
    });
  }

  onScopeChange(scopeId: number): void {
    const scope = this.allScopes().find(s => s.id === scopeId);
    if (!scope?.trade_id) return;

    this.subcontractorService.getSubcontractors({ trade_id: scope.trade_id, per_page: 100 }).subscribe(res => {
      this.subcontractors.set(res.data);
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    const v = this.form.value;
    this.saving.set(true);

    this.bidService.submitBid({
      company_id: v.company_id!,
      project_scope_id: v.project_scope_id!,
      amount: v.amount!,
      description: v.description || undefined,
      timeline_days: v.timeline_days ?? undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Bid submitted successfully.', 'Dismiss', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to submit bid. Please try again.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
