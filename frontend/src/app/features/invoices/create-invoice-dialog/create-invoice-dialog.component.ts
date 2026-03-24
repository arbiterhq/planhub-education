import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ContractService } from '../../../core/services/contract.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { Contract } from '../../../shared/models/contract.model';

@Component({
  selector: 'app-create-invoice-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
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
      Create Invoice
      <span class="demo-badge">DEMO</span>
    </h2>

    <mat-dialog-content>
      <p class="demo-note">
        This simulates a subcontractor submitting an invoice. In production, subcontractors
        would submit invoices via their own portal.
      </p>

      <form [formGroup]="form" class="form-content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contract</mat-label>
          <mat-select formControlName="contract_id" (selectionChange)="onContractChange($event.value)">
            @if (loadingContracts()) {
              <mat-option disabled>Loading contracts…</mat-option>
            }
            @for (c of contracts(); track c.id) {
              <mat-option [value]="c.id">
                {{ c.project?.name ?? '—' }} — {{ getContractTrade(c) }} ({{ c.amount | currency }})
              </mat-option>
            }
          </mat-select>
          @if (form.get('contract_id')?.hasError('required') && form.get('contract_id')?.touched) {
            <mat-error>Contract is required</mat-error>
          }
        </mat-form-field>

        <!-- Contract context shown after selection -->
        @if (selectedContract()) {
          <div class="contract-context">
            <div class="context-row">
              <span>Contract Amount:</span>
              <strong>{{ selectedContract()!.amount | currency }}</strong>
            </div>
            <div class="context-row">
              <span>Already Invoiced:</span>
              <strong>{{ selectedContract()!.already_invoiced ?? 0 | currency }}</strong>
            </div>
            <div class="context-row">
              <span>Remaining Balance:</span>
              <strong [class.balance-warning]="remainingBalance() <= 0">
                {{ remainingBalance() | currency }}
              </strong>
            </div>
          </div>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount ($)</mat-label>
          <input matInput type="number" formControlName="amount" min="0.01" step="100">
          @if (form.get('amount')?.hasError('required') && form.get('amount')?.touched) {
            <mat-error>Amount is required</mat-error>
          }
          @if (form.get('amount')?.hasError('min')) {
            <mat-error>Amount must be greater than 0</mat-error>
          }
          @if (form.get('amount')?.hasError('exceedsBalance')) {
            <mat-error>Amount exceeds the remaining contract balance ({{ remainingBalance() | currency }})</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    placeholder="Describe the work being invoiced…"></textarea>
          @if (form.get('description')?.hasError('required') && form.get('description')?.touched) {
            <mat-error>Description is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Due Date</mat-label>
          <input matInput type="date" formControlName="due_date" [min]="minDueDate">
          @if (form.get('due_date')?.hasError('required') && form.get('due_date')?.touched) {
            <mat-error>Due date is required</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary"
              [disabled]="form.invalid || saving()"
              (click)="submit()">
        @if (saving()) { <mat-spinner diameter="18" class="btn-spinner"></mat-spinner> }
        Submit Invoice
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 460px; }

    h2[mat-dialog-title] {
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

    .contract-context {
      background: rgba(25,118,210,0.05);
      border: 1px solid rgba(25,118,210,0.15);
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .context-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
    }
    .balance-warning { color: #c62828; }

    .btn-spinner { display: inline-block; margin-right: 8px; }
    :host ::ng-deep .btn-spinner circle { stroke: white; }
  `],
})
export class CreateInvoiceDialogComponent implements OnInit {
  private contractService = inject(ContractService);
  private invoiceService = inject(InvoiceService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateInvoiceDialogComponent>);

  contracts = signal<Contract[]>([]);
  selectedContract = signal<Contract | null>(null);
  loadingContracts = signal(false);
  saving = signal(false);

  minDueDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  form = new FormGroup({
    contract_id: new FormControl<number | null>(null, Validators.required),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    description: new FormControl('', Validators.required),
    due_date: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    this.loadingContracts.set(true);
    this.contractService.getContracts().subscribe({
      next: (res) => {
        this.contracts.set(res.data);
        this.loadingContracts.set(false);
      },
      error: () => this.loadingContracts.set(false),
    });
  }

  onContractChange(contractId: number): void {
    const contract = this.contracts().find(c => c.id === contractId) ?? null;
    this.selectedContract.set(contract);
    // Re-validate amount against new balance
    this.form.get('amount')?.updateValueAndValidity();
  }

  remainingBalance(): number {
    const c = this.selectedContract();
    if (!c) return 0;
    return c.amount - (c.already_invoiced ?? 0);
  }

  getContractTrade(contract: Contract): string {
    return (contract.trade as any)?.name ?? '—';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const amount = v.amount!;
    const remaining = this.remainingBalance();

    if (amount > remaining) {
      this.form.get('amount')?.setErrors({ exceedsBalance: true });
      return;
    }

    this.saving.set(true);
    this.invoiceService.createInvoice({
      contract_id: v.contract_id!,
      amount,
      description: v.description!,
      due_date: v.due_date!,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Invoice submitted successfully.', 'Dismiss', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Failed to submit invoice. Please try again.';
        this.snackBar.open(msg, 'Dismiss', { duration: 5000 });
      },
    });
  }
}
