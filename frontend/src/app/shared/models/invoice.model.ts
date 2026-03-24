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
  project?: { id: number; name: string };
}

export interface InvoiceSummary {
  total_outstanding: number;
  pending_review: number;
  approved_unpaid: number;
  paid_this_month: number;
  paid_all_time: number;
  total_invoiced: number;
  by_status: Record<InvoiceStatus, number>;
}
