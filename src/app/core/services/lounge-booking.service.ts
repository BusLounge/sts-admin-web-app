import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoungeBooking } from '../models/lounge-booking.model';

@Injectable({ providedIn: 'root' })
export class LoungeBookingService {
  private readonly _bookings$ = new BehaviorSubject<LoungeBooking[]>([
    {
      booking_id: 'LBK-1001',
      passenger_id: 'PAS-001',
      lounge_name: 'Alpha Lounge',
      start_datetime: '2025-09-02T10:00:00Z',
      duration_hours: 2,
      guests: 2,
      capacity_used: 2,
      total_amount: 30,
      payment_status: 'Paid',
      booking_status: 'Completed',
      created_at: '2025-09-01T09:00:00Z'
    },
    {
      booking_id: 'LBK-1002',
      passenger_id: 'PAS-014',
      lounge_name: 'Beta Premium Lounge',
      start_datetime: '2025-09-14T15:00:00Z',
      duration_hours: 3,
      guests: 4,
      capacity_used: 4,
      total_amount: 75,
      payment_status: 'Pending',
      booking_status: 'Confirmed',
      created_at: '2025-09-10T12:30:00Z'
    },
    {
      booking_id: 'LBK-1003',
      passenger_id: 'PAS-222',
      lounge_name: 'Gamma Relax',
      start_datetime: '2025-08-28T09:30:00Z',
      duration_hours: 1,
      guests: 1,
      capacity_used: 1,
      total_amount: 12,
      payment_status: 'Failed',
      booking_status: 'Cancelled',
      created_at: '2025-08-27T14:00:00Z'
    }
  ]);

  readonly bookings$ = this._bookings$.asObservable();

  get bookings(): LoungeBooking[] { return this._bookings$.getValue(); }

  add(b: LoungeBooking) { this._bookings$.next([...this.bookings, b]); }
  update(b: LoungeBooking) { this._bookings$.next(this.bookings.map(x => x.booking_id === b.booking_id ? b : x)); }
  delete(id: string) { this._bookings$.next(this.bookings.filter(x => x.booking_id !== id)); }

  // Aggregations for charts
  countByPaymentStatus() {
    const map: Record<string, number> = { Paid: 0, Pending: 0, Failed: 0 };
    this.bookings.forEach(b => map[b.payment_status] = (map[b.payment_status] || 0) + 1);
    return map;
  }

  countByBookingStatus() {
    const map: Record<string, number> = { Confirmed: 0, Pending: 0, Cancelled: 0, Completed: 0 };
    this.bookings.forEach(b => map[b.booking_status] = (map[b.booking_status] || 0) + 1);
    return map;
  }

  monthlyRevenue(year: number) {
    const arr = Array(12).fill(0);
    this.bookings
      .filter(b => new Date(b.start_datetime).getFullYear() === year && b.payment_status === 'Paid')
      .forEach(b => {
        const m = new Date(b.start_datetime).getMonth();
        arr[m] += b.total_amount;
      });
    return arr;
  }
}