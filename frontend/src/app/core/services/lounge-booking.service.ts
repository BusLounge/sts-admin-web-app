import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoungeBooking } from '../models/lounge-booking.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoungeBookingService {
  private readonly _bookings$ = new BehaviorSubject<LoungeBooking[]>([]);
  readonly bookings$ = this._bookings$.asObservable();
  private apiUrl = `${environment.apiUrl}/lounge-bookings`;

  constructor(private http: HttpClient) {
    this.loadBookings();
  }

  get bookings(): LoungeBooking[] { 
    return this._bookings$.getValue(); 
  }

  loadBookings(): void {
    this.http.get<LoungeBooking[]>(this.apiUrl).subscribe({
      next: (data) => this._bookings$.next(data),
      error: (err) => console.error('Error loading lounge bookings:', err)
    });
  }

  add(b: LoungeBooking): Observable<any> {
    return this.http.post(this.apiUrl, b);
  }

  update(b: LoungeBooking): Observable<any> {
    return this.http.put(`${this.apiUrl}/${b.lounge_booking_id}`, b);
  }

  updatePaymentStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/payment-status`, { status });
  }

  updateBookingStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/booking-status`, { status });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getById(id: string): Observable<LoungeBooking> {
    return this.http.get<LoungeBooking>(`${this.apiUrl}/${id}`);
  }

  // Aggregations for charts
  countByPaymentStatus() {
    const map: Record<string, number> = { paid: 0, pending: 0, failed: 0 };
    this.bookings.forEach(b => map[b.payment_status] = (map[b.payment_status] || 0) + 1);
    return map;
  }

  countByBookingStatus() {
    const map: Record<string, number> = { confirmed: 0, pending: 0, cancelled: 0, completed: 0 };
    this.bookings.forEach(b => map[b.status] = (map[b.status] || 0) + 1);
    return map;
  }

  monthlyRevenue(year: number) {
    const arr = Array(12).fill(0);
    this.bookings
      .filter(b => new Date(b.scheduled_arrival).getFullYear() === year && b.payment_status === 'paid')
      .forEach(b => {
        const m = new Date(b.scheduled_arrival).getMonth();
        arr[m] += b.total_amount;
      });
    return arr;
  }
}