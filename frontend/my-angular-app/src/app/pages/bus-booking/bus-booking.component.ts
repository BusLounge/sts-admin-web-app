import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { BusBookingService } from '../../core/services/bus-booking.service';
import { BusBooking } from '../../core/models/bus-booking.model';

@Component({
  selector: 'app-bus-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './bus-booking.component.html',
  styleUrls: ['./bus-booking.component.scss']
})
export class BusBookingComponent implements OnInit {
  sidebarOpen = true;
  currentPage = 'bus-booking';

  bookings: BusBooking[] = [];
  filtered: BusBooking[] = [];
  searchTerm = '';

  paymentFilter: 'All' | 'Pending' | 'Paid' | 'Failed' | 'Refunded' = 'All';
  statusFilter: 'All' | 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed' = 'All';

  // Chart data
  payStatusCounts: Record<string, number> = {};
  bookStatusCounts: Record<string, number> = {};
  revenueMonths: number[] = [];
  months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Expose Math to template
  Math = Math;

  constructor(private router: Router, private svc: BusBookingService) {}

  ngOnInit(): void {
    this.svc.bookings$.subscribe(bs => {
      this.bookings = bs;
      this.applyFilters();
      this.refreshCharts();
    });
  }

  onNavigate(page: string) {
    this.currentPage = page;
    this.router.navigate([`/${page}`]);
  }
  onLogout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  applyFilters() {
    const q = this.searchTerm.trim().toLowerCase();
    this.filtered = this.bookings.filter(b => {
      const matchesSearch = !q || [
        b.booking_id,
        b.passenger_id,
        b.passenger_name,
        b.bus_number,
        b.bus_name || '',
        `${b.from} ${b.to}`,
        b.seat_numbers.join(' ')
      ].some(x => x.toLowerCase().includes(q)) ||
      b.total_fare.toString().includes(q) || b.seats_booked.toString().includes(q);

      const matchesPay = this.paymentFilter === 'All' || b.payment_status === this.paymentFilter;
      const matchesStatus = this.statusFilter === 'All' || b.booking_status === this.statusFilter;
      return matchesSearch && matchesPay && matchesStatus;
    });
  }

  clearSearch() { this.searchTerm = ''; this.applyFilters(); }

  viewBooking(b: BusBooking) { alert(`View ${b.booking_id}`); }
  updateBooking(b: BusBooking) { alert(`Update ${b.booking_id}`); }
  deleteBooking(b: BusBooking) {
    const ok = confirm(`Delete booking ${b.booking_id}?`);
    if (ok) this.svc.delete(b.booking_id);
  }

  refreshCharts() {
    this.payStatusCounts = this.svc.countByPaymentStatus();
    this.bookStatusCounts = this.svc.countByBookingStatus();
    this.revenueMonths = this.svc.monthlyRevenue(new Date().getFullYear());
  }

  // Helpers for simple CSS charts
  getPayCount(key: 'Paid'|'Pending'|'Failed'|'Refunded') { return this.payStatusCounts[key] || 0; }
  getBookCount(key: 'Confirmed'|'Pending'|'Cancelled'|'Completed') { return this.bookStatusCounts[key] || 0; }
  getRevenueMax() { return Math.max(1, ...this.revenueMonths); }

  getRevenuePoints(): string {
    const max = Math.max(1, ...this.revenueMonths);
    return this.revenueMonths.map((v, i) => {
      const x = 20 + i * ((640 - 40) / (this.months.length - 1));
      const y = 240 - (v / max) * (240 - 40);
      return `${x},${y}`;
    }).join(' ');
  }

  onPaymentStatusChange(booking: BusBooking): void {
    console.log('Payment status changed:', booking);
    // Update charts after payment status change
    this.refreshCharts();
    // Add your update logic here, e.g., call API to update backend
  }

  onBookingStatusChange(booking: BusBooking): void {
    console.log('Booking status changed:', booking);
    // Update charts after booking status change
    this.refreshCharts();
    // Add your update logic here, e.g., call API to update backend
  }
}
