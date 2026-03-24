import { Company } from './user.model';
import { ProjectScope } from './project.model';

export type InvitationStatus = 'sent' | 'viewed' | 'bid_submitted' | 'declined';

export interface InvitationToBid {
  id: number;
  project_scope_id: number;
  company_id: number;
  notes: string | null;
  status: InvitationStatus;
  sent_at: string | null;
  viewed_at: string | null;
  created_at: string;
  updated_at: string;
  company?: Company;
  project_scope?: ProjectScope & {
    project?: { id: number; name: string };
  };
}
