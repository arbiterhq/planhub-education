import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trade } from '../../shared/models/project.model';

@Injectable({ providedIn: 'root' })
export class TradeService {
  private http = inject(HttpClient);

  getTrades(): Observable<{ data: Trade[] }> {
    return this.http.get<{ data: Trade[] }>('/api/trades');
  }
}
