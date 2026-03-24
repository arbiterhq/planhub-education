import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subcontractor } from '../../shared/models/subcontractor.model';
import { PaginatedResponse } from '../../shared/models/paginated-response.model';
import { cleanParams } from '../../shared/utils/api.utils';

@Injectable({ providedIn: 'root' })
export class SubcontractorService {
  private http = inject(HttpClient);

  getSubcontractors(params?: {
    trade_id?: number;
    search?: string;
    city?: string;
    page?: number;
    per_page?: number;
  }): Observable<PaginatedResponse<Subcontractor>> {
    return this.http.get<PaginatedResponse<Subcontractor>>('/api/subcontractors', { params: cleanParams(params) });
  }

  getSubcontractor(id: number): Observable<{ data: Subcontractor }> {
    return this.http.get<{ data: Subcontractor }>(`/api/subcontractors/${id}`);
  }

  createSubcontractor(data: any): Observable<{ data: Subcontractor }> {
    return this.http.post<{ data: Subcontractor }>('/api/subcontractors', data);
  }

  updateSubcontractor(id: number, data: any): Observable<{ data: Subcontractor }> {
    return this.http.put<{ data: Subcontractor }>(`/api/subcontractors/${id}`, data);
  }
}
