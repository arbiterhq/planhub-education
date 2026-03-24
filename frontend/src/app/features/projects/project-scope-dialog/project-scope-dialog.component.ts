import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProjectService } from '../../../core/services/project.service';
import { TradeService } from '../../../core/services/trade.service';
import { ProjectScope, Trade } from '../../../shared/models/project.model';

export interface ScopeDialogData {
  projectId: number;
  scope?: ProjectScope;
}

@Component({
  selector: 'app-project-scope-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Scope' : 'Add Scope' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Trade</mat-label>
          <mat-select formControlName="trade_id">
            @for (trade of trades(); track trade.id) {
              <mat-option [value]="trade.id">{{ trade.name }} — {{ trade.category }}</mat-option>
            }
          </mat-select>
          @if (form.get('trade_id')?.hasError('required')) {
            <mat-error>Trade is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Estimated Value</mat-label>
          <span matTextPrefix>$&nbsp;</span>
          <input matInput type="number" formControlName="estimated_value" min="0">
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
    .form-grid { display: flex; flex-direction: column; padding-top: 8px; }
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 400px; }
  `],
})
export class ProjectScopeDialogComponent implements OnInit {
  private tradeService = inject(TradeService);
  private projectService = inject(ProjectService);
  private dialogRef = inject(MatDialogRef<ProjectScopeDialogComponent>);
  data = inject<ScopeDialogData>(MAT_DIALOG_DATA);

  trades = signal<Trade[]>([]);
  saving = false;
  isEdit = !!this.data.scope;

  form = new FormGroup({
    trade_id: new FormControl<number | null>(this.data.scope?.trade_id ?? null, [Validators.required]),
    description: new FormControl(this.data.scope?.description ?? ''),
    estimated_value: new FormControl<number | null>(this.data.scope?.estimated_value ?? null),
  });

  ngOnInit(): void {
    this.tradeService.getTrades().subscribe(res => this.trades.set(res.data));
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const payload = this.form.value as Partial<ProjectScope>;
    const req = this.isEdit
      ? this.projectService.updateScope(this.data.projectId, this.data.scope!.id, payload)
      : this.projectService.addScope(this.data.projectId, payload);

    req.subscribe({
      next: (res) => { this.saving = false; this.dialogRef.close(res.data); },
      error: () => { this.saving = false; },
    });
  }
}
