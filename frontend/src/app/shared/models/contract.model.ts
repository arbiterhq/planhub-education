import { Company } from './user.model';
import { Trade } from './project.model';

export type ContractStatus = 'draft' | 'pending' | 'active' | 'completed' | 'terminated';

export interface Contract {
  id: number;
  bid_id: number | null;
  project_id: number;
  company_id: number;
  trade_id: number;
  amount: number;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  signed_at: string | null;
  company?: Company | { id: number; name: string };
  trade?: Trade | { id: number; name: string };
  project?: { id: number; name: string };
  already_invoiced?: number;
}
