import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  RefundItem, 
  RefundDetail, 
  RefundStats, 
  ApproveRefundRequest, 
  RejectRefundRequest 
} from '../models/refund.model';

@Injectable({
  providedIn: 'root'
})
export class RefundService {
  private apiUrl = `${environment.apiUrl}/refunds`;

  constructor(private http: HttpClient) {}

  getRefunds(status: string = 'all', page: number = 1, limit: number = 50): Observable<{ data: RefundItem[]; total: number; page: number; limit: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status && status !== 'all') {
      params = params.set('status', status);
    }

    return this.http.get<{ data: RefundItem[]; total: number; page: number; limit: number }>(this.apiUrl, { params });
  }

  getRefundById(id: string): Observable<RefundDetail> {
    return this.http.get<RefundDetail>(`${this.apiUrl}/${id}`);
  }

  getRefundStats(): Observable<RefundStats> {
    const timestamp = new Date().getTime();
    return this.http.get<RefundStats>(`${this.apiUrl}/stats?t=${timestamp}`);
  }

  approveRefund(id: string, req: ApproveRefundRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/approve`, req);
  }

  rejectRefund(id: string, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/reject`, { reason });
  }
}
