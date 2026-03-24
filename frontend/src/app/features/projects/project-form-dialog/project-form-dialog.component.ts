import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../shared/models/project.model';

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Project' : 'New Project' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Downtown Office Tower">
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <div class="two-col">
          <mat-form-field appearance="outline">
            <mat-label>Project Type</mat-label>
            <mat-select formControlName="project_type">
              <mat-option value="">— None —</mat-option>
              @for (type of projectTypes; track type) {
                <mat-option [value]="type">{{ type }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="planning">Planning</mat-option>
              <mat-option value="bidding">Bidding</mat-option>
              <mat-option value="in_progress">In Progress</mat-option>
              <mat-option value="completed">Completed</mat-option>
              <mat-option value="on_hold">On Hold</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Address</mat-label>
          <input matInput formControlName="address">
        </mat-form-field>

        <div class="three-col">
          <mat-form-field appearance="outline" class="city-col">
            <mat-label>City</mat-label>
            <input matInput formControlName="city">
          </mat-form-field>
          <mat-form-field appearance="outline" class="state-col">
            <mat-label>State</mat-label>
            <input matInput formControlName="state" maxlength="2">
          </mat-form-field>
          <mat-form-field appearance="outline" class="zip-col">
            <mat-label>Zip</mat-label>
            <input matInput formControlName="zip">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Estimated Budget</mat-label>
          <span matTextPrefix>$&nbsp;</span>
          <input matInput type="number" formControlName="estimated_budget" min="0">
        </mat-form-field>

        <div class="three-col">
          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="start_date">
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="end_date">
            <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Bid Due Date</mat-label>
            <input matInput [matDatepicker]="bidPicker" formControlName="bid_due_date">
            <mat-datepicker-toggle matIconSuffix [for]="bidPicker"></mat-datepicker-toggle>
            <mat-datepicker #bidPicker></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 0; padding-top: 8px; }
    .full-width { width: 100%; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .three-col { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; }
    mat-dialog-content { max-height: 70vh; }
  `],
})
export class ProjectFormDialogComponent {
  private projectService = inject(ProjectService);
  private dialogRef = inject(MatDialogRef<ProjectFormDialogComponent>);
  data = inject<Project | null>(MAT_DIALOG_DATA);

  isEdit = !!this.data;
  saving = false;

  readonly projectTypes = [
    'Commercial Office', 'Healthcare', 'Education', 'Residential',
    'Government', 'Industrial', 'Hospitality', 'Mixed-Use',
  ];

  form = new FormGroup({
    name: new FormControl(this.data?.name ?? '', [Validators.required]),
    project_type: new FormControl(this.data?.project_type ?? ''),
    status: new FormControl(this.data?.status ?? 'planning'),
    address: new FormControl(this.data?.address ?? ''),
    city: new FormControl(this.data?.city ?? ''),
    state: new FormControl(this.data?.state ?? ''),
    zip: new FormControl(this.data?.zip ?? ''),
    estimated_budget: new FormControl<number | null>(this.data?.estimated_budget ?? null),
    start_date: new FormControl<Date | null>(
      this.data?.start_date ? new Date(this.data.start_date) : null
    ),
    end_date: new FormControl<Date | null>(
      this.data?.end_date ? new Date(this.data.end_date) : null
    ),
    bid_due_date: new FormControl<Date | null>(
      this.data?.bid_due_date ? new Date(this.data.bid_due_date) : null
    ),
    description: new FormControl(this.data?.description ?? ''),
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const v = this.form.value;
    const payload = {
      ...v,
      start_date: v.start_date ? this.toDateString(v.start_date) : null,
      end_date: v.end_date ? this.toDateString(v.end_date) : null,
      bid_due_date: v.bid_due_date ? this.toDateString(v.bid_due_date) : null,
    };

    const req = this.isEdit
      ? this.projectService.updateProject(this.data!.id, payload as Partial<Project>)
      : this.projectService.createProject(payload as Partial<Project>);

    req.subscribe({
      next: (res) => { this.saving = false; this.dialogRef.close(res.data); },
      error: () => { this.saving = false; },
    });
  }

  private toDateString(date: Date | string): string {
    if (typeof date === 'string') return date;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
