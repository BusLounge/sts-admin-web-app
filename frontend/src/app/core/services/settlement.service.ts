import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SettlementOverview } from '../models/settlement.model';

@Injectable({
  providedIn: 'root'
})
export class SettlementService {
  private apiUrl = `${environment.apiUrl}/api/settlements`;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<SettlementOverview> {
    return this.http.get<SettlementOverview>(`${this.apiUrl}/overview`);
  }

  processNow(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/process-now`, {});
  }
}
