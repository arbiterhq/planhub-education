import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bid } from '../../shared/models/bid.model';
import { PaginatedResponse } from '../../shared/models/paginated-response.model';
import { cleanParams } from '../../shared/utils/api.utils';

@Injectable({ providedIn: 'root' })
export class BidService {
  private http = inject(HttpClient);

  getBids(params?: {
    project_id?: number;
    project_scope_id?: number;
    status?: string;
    sort?: string;
    direction?: string;
    page?: number;
    per_page?: number;
  }): Observable<PaginatedResponse<Bid>> {
    return this.http.get<PaginatedResponse<Bid>>('/api/bids', { params: cleanParams(params) });
  }

  getBid(id: number): Observable<{ data: Bid; sibling_bids: Bid[] }> {
    return this.http.get<{ data: Bid; sibling_bids: Bid[] }>(`/api/bids/${id}`);
  }

  submitBid(data: {
    company_id: number;
    project_scope_id: number;
    amount: number;
    description?: string;
    timeline_days?: number;
    invitation_id?: number;
  }): Observable<{ data: Bid }> {
    return this.http.post<{ data: Bid }>('/api/bids', data);
  }

  reviewBid(id: number, action: 'accept' | 'reject', notes?: string): Observable<{ data: Bid }> {
    return this.http.put<{ data: Bid }>(`/api/bids/${id}/review`, { action, notes });
  }
}
