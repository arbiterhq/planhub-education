import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InvitationToBid } from '../../shared/models/invitation.model';
import { PaginatedResponse } from '../../shared/models/paginated-response.model';
import { cleanParams } from '../../shared/utils/api.utils';

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private http = inject(HttpClient);

  getInvitations(params?: {
    project_id?: number;
    status?: string;
    page?: number;
    per_page?: number;
  }): Observable<PaginatedResponse<InvitationToBid>> {
    return this.http.get<PaginatedResponse<InvitationToBid>>('/api/invitations', { params: cleanParams(params) });
  }

  sendInvitation(data: { project_scope_id: number; company_id: number; notes?: string }): Observable<any> {
    return this.http.post('/api/invitations', data);
  }

  sendBulkInvitations(data: { project_scope_id: number; company_ids: number[]; notes?: string }): Observable<any> {
    return this.http.post('/api/invitations/bulk', data);
  }
}
