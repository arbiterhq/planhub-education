import { BidStatus } from './bid.model';
import { ContractStatus } from './contract.model';
import { Trade } from './project.model';

export interface Subcontractor {
  id: number;
  name: string;
  type: 'subcontractor';
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  license_number: string | null;
  established_year: number | null;
  employee_count: number | null;
  trades?: Trade[];
  total_bids?: number;
  accepted_bids?: number;
  win_rate?: number;
  active_contracts_count?: number;
  bids?: SubcontractorBid[];
  contracts?: SubcontractorContract[];
  created_at: string;
}

export interface SubcontractorBid {
  id: number;
  amount: number;
  timeline_days: number | null;
  status: BidStatus;
  submitted_at: string | null;
  project_scope?: {
    id: number;
    project?: { id: number; name: string };
    trade?: { id: number; name: string };
  };
}

export interface SubcontractorContract {
  id: number;
  project_id: number;
  trade_id: number;
  amount: number;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  project?: { id: number; name: string };
  trade?: { id: number; name: string };
}
