import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BusBooking } from '../models/bus-booking.model';

@Injectable({ providedIn: 'root' })
export class BusBookingService {
  private readonly _bookings$ = new BehaviorSubject<BusBooking[]>([
    {
      booking_id: 'BBK-1001',
      passenger_id: 'PAS-001',
      passenger_name: 'John Doe',
      bus_number: 'BUS-101',
      bus_name: 'Blue Line',
      from: 'Kathmandu',
      to: 'Pokhara',
      journey_datetime: '2025-09-18T08:00:00Z',
      seats_booked: 2,
      seat_numbers: ['A1', 'A2'],
      total_fare: 2000,
      payment_status: 'Paid',
      booking_status: 'Confirmed',
      created_at: '2025-09-10T09:00:00Z'
    },
    {
      booking_id: 'BBK-1002',
      passenger_id: 'PAS-014',
      passenger_name: 'Jane Smith',
      bus_number: 'BUS-202',
      bus_name: 'Red Express',
      from: 'Pokhara',
      to: 'Chitwan',
      journey_datetime: '2025-09-20T10:30:00Z',
      seats_booked: 3,
      seat_numbers: ['B1', 'B2', 'B3'],
      total_fare: 3000,
      payment_status: 'Pending',
      booking_status: 'Pending',
      created_at: '2025-09-12T10:30:00Z'
    },
    {
      booking_id: 'BBK-1003',
      passenger_id: 'PAS-222',
      passenger_name: 'Bob Lee',
      bus_number: 'BUS-303',
      bus_name: 'Green Shuttle',
      from: 'Chitwan',
      to: 'Kathmandu',
      journey_datetime: '2025-08-28T09:30:00Z',
      seats_booked: 1,
      seat_numbers: ['C4'],
      total_fare: 1000,
      payment_status: 'Failed',
      booking_status: 'Cancelled',
      created_at: '2025-08-27T14:00:00Z'
    }
  ]);

  readonly bookings$ = this._bookings$.asObservable();

  get bookings(): BusBooking[] { return this._bookings$.getValue(); }

  add(b: BusBooking) { this._bookings$.next([...this.bookings, b]); }
  update(b: BusBooking) { this._bookings$.next(this.bookings.map(x => x.booking_id === b.booking_id ? b : x)); }
  delete(id: string) { this._bookings$.next(this.bookings.filter(x => x.booking_id !== id)); }

  // Aggregations for charts
  countByPaymentStatus() {
    const map: Record<string, number> = { Paid: 0, Pending: 0, Failed: 0, Refunded: 0 };
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
      .filter(b => new Date(b.journey_datetime).getFullYear() === year && b.payment_status === 'Paid')
      .forEach(b => {
        const m = new Date(b.journey_datetime).getMonth();
        arr[m] += b.total_fare;
      });
    return arr;
  }
}