import { Bid } from './bid.model';
import { Contract } from './contract.model';
import { Invoice } from './invoice.model';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  project_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  estimated_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  bid_due_date: string | null;
  scopes_count?: number;
  active_bids_count?: number;
  contracts_count?: number;
  scopes?: ProjectScope[];
  contracts?: Contract[];
  invoices?: Invoice[];
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'planning' | 'bidding' | 'in_progress' | 'completed' | 'on_hold';

export interface ProjectScope {
  id: number;
  project_id: number;
  trade_id: number;
  trade?: Trade;
  description: string | null;
  estimated_value: number;
  status: ScopeStatus;
  bids_count?: number;
  bids?: Bid[];
  invitations_count?: number;
}

export type ScopeStatus = 'open' | 'bidding' | 'awarded' | 'in_progress' | 'completed';

export interface Trade {
  id: number;
  name: string;
  category: string;
}
