import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SubcontractorService } from '../../../core/services/subcontractor.service';
import { TradeService } from '../../../core/services/trade.service';
import { Subcontractor } from '../../../shared/models/subcontractor.model';
import { Trade } from '../../../shared/models/project.model';

@Component({
  selector: 'app-subcontractor-form-dialog',
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
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Subcontractor' : 'Add Subcontractor' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Company Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Summit Plumbing Solutions">
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Trades</mat-label>
          <mat-select formControlName="trades" multiple>
            @for (trade of trades(); track trade.id) {
              <mat-option [value]="trade.id">{{ trade.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

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

        <div class="two-col">
          <mat-form-field appearance="outline">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Website</mat-label>
          <input matInput formControlName="website" placeholder="https://">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="three-col">
          <mat-form-field appearance="outline">
            <mat-label>Employee Count</mat-label>
            <input matInput type="number" formControlName="employee_count" min="1">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Established Year</mat-label>
            <input matInput type="number" formControlName="established_year" min="1800" max="2100">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>License Number</mat-label>
            <input matInput formControlName="license_number">
          </mat-form-field>
        </div>
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
export class SubcontractorFormDialogComponent implements OnInit {
  private subcontractorService = inject(SubcontractorService);
  private tradeService = inject(TradeService);
  private dialogRef = inject(MatDialogRef<SubcontractorFormDialogComponent>);
  data = inject<Subcontractor | null>(MAT_DIALOG_DATA);

  isEdit = !!this.data;
  saving = false;
  trades = signal<Trade[]>([]);

  form = new FormGroup({
    name: new FormControl(this.data?.name ?? '', [Validators.required]),
    trades: new FormControl<number[]>(this.data?.trades?.map(t => t.id) ?? []),
    address: new FormControl(this.data?.address ?? ''),
    city: new FormControl(this.data?.city ?? ''),
    state: new FormControl(this.data?.state ?? ''),
    zip: new FormControl(this.data?.zip ?? ''),
    phone: new FormControl(this.data?.phone ?? ''),
    email: new FormControl(this.data?.email ?? ''),
    website: new FormControl(this.data?.website ?? ''),
    description: new FormControl(this.data?.description ?? ''),
    employee_count: new FormControl<number | null>(this.data?.employee_count ?? null),
    established_year: new FormControl<number | null>(this.data?.established_year ?? null),
    license_number: new FormControl(this.data?.license_number ?? ''),
  });

  ngOnInit(): void {
    this.tradeService.getTrades().subscribe(res => this.trades.set(res.data));
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const req = this.isEdit
      ? this.subcontractorService.updateSubcontractor(this.data!.id, this.form.value)
      : this.subcontractorService.createSubcontractor(this.form.value);

    req.subscribe({
      next: (res) => { this.saving = false; this.dialogRef.close(res.data); },
      error: () => { this.saving = false; },
    });
  }
}
