import { Company } from './user.model';
import { Contract } from './contract.model';

export type InvoiceStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'paid' | 'rejected';

export interface Invoice {
  id: number;
  contract_id: number;
  company_id: number;
  project_id: number;
  invoice_number: string;
  amount: number;
  description: string | null;
  status: InvoiceStatus;
  due_date: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  company?: Company;
  contract?: Contract;
}
