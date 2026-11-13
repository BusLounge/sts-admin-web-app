import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SettlementOverview, SpecialRequestItem, BatchDetail, ProcessNowResult, PricingConfig } from '../models/settlement.model';

@Injectable({
  providedIn: 'root'
})
export class SettlementService {
  private apiUrl = `${environment.apiUrl}/settlements`;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<SettlementOverview> {
    const timestamp = new Date().getTime();
    return this.http.get<SettlementOverview>(`${this.apiUrl}/overview?t=${timestamp}`);
  }

  getWallet(): Observable<any> {
    const timestamp = new Date().getTime();
    return this.http.get<any>(`${this.apiUrl}/wallet?t=${timestamp}`);
  }

  processNow(): Observable<ProcessNowResult> {
    return this.http.post<ProcessNowResult>(`${this.apiUrl}/process-now`, {});
  }

  getSpecialRequests(): Observable<SpecialRequestItem[]> {
    const timestamp = new Date().getTime();
    return this.http.get<SpecialRequestItem[]>(`${this.apiUrl}/special-requests?t=${timestamp}`);
  }

  actionSpecialRequest(id: string, action: 'approve' | 'reject'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/special-requests/${id}/action`, { action });
  }

  getBatchDetails(id: string): Observable<BatchDetail> {
    const timestamp = new Date().getTime();
    return this.http.get<BatchDetail>(`${this.apiUrl}/batches/${id}?t=${timestamp}`);
  }

  topUpWallet(amount: number, description?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/wallet/top-up`, {
      amount,
      description: description || 'Manual Treasury Deposit'
    });
  }

  updateReserve(reserveThreshold: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/wallet/reserve`, {
      reserve_threshold: reserveThreshold
    });
  }

  getPricingConfig(): Observable<PricingConfig> {
    const timestamp = new Date().getTime();
    return this.http.get<PricingConfig>(`${this.apiUrl}/pricing-config?t=${timestamp}`);
  }

  updatePricingConfig(config: PricingConfig): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pricing-config`, config);
  }
}

