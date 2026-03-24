import { Company } from './user.model';

export type BidStatus = 'pending' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';

export interface Bid {
  id: number;
  invitation_id: number | null;
  company_id: number;
  project_scope_id: number;
  amount: number;
  description: string | null;
  timeline_days: number | null;
  status: BidStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
  company?: Company;
}
