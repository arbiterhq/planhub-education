import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contract } from '../../shared/models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private http = inject(HttpClient);

  getContracts(): Observable<{ data: Contract[] }> {
    return this.http.get<{ data: Contract[] }>('/api/contracts');
  }
}
