import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice, InvoiceSummary } from '../../shared/models/invoice.model';
import { PaginatedResponse } from '../../shared/models/paginated-response.model';
import { cleanParams } from '../../shared/utils/api.utils';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);

  getInvoices(params?: {
    status?: string;
    project_id?: number;
    company_id?: number;
    date_from?: string;
    date_to?: string;
    sort?: string;
    direction?: string;
    page?: number;
    per_page?: number;
  }): Observable<PaginatedResponse<Invoice>> {
    return this.http.get<PaginatedResponse<Invoice>>('/api/invoices', { params: cleanParams(params) });
  }

  getInvoice(id: number): Observable<{ data: Invoice; total_invoiced_for_contract: number }> {
    return this.http.get<{ data: Invoice; total_invoiced_for_contract: number }>(`/api/invoices/${id}`);
  }

  getSummary(): Observable<InvoiceSummary> {
    return this.http.get<InvoiceSummary>('/api/invoices/summary');
  }

  createInvoice(data: {
    contract_id: number;
    amount: number;
    description: string;
    due_date: string;
  }): Observable<{ data: Invoice }> {
    return this.http.post<{ data: Invoice }>('/api/invoices', data);
  }

  reviewInvoice(id: number, action: 'approve' | 'reject', notes?: string): Observable<{ data: Invoice }> {
    return this.http.put<{ data: Invoice }>(`/api/invoices/${id}/review`, { action, notes });
  }

  payInvoice(id: number): Observable<{ data: Invoice }> {
    return this.http.put<{ data: Invoice }>(`/api/invoices/${id}/pay`, {});
  }
}
