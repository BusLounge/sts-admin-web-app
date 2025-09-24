import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { LoungeBookingService } from '../../core/services/lounge-booking.service';
import { LoungeBooking } from '../../core/models/lounge-booking.model';

@Component({
  selector: 'app-lounge-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './lounge-booking.component.html',
  styleUrls: ['./lounge-booking.component.scss']
})
export class LoungeBookingComponent implements OnInit {
  sidebarOpen = true;
  currentPage = 'lounge-booking';

  bookings: LoungeBooking[] = [];
  filtered: LoungeBooking[] = [];
  searchTerm = '';

  paymentFilter: 'All' | 'Pending' | 'Paid' | 'Failed' = 'All';
  statusFilter: 'All' | 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed' = 'All';

  // Sorting properties
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Chart data
  payStatusCounts: Record<string, number> = {};
  bookStatusCounts: Record<string, number> = {};
  revenueMonths: number[] = [];
  months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Monthly (current month) paid revenue grouped by lounge
  private currentYear = new Date().getFullYear();
  private currentMonth = new Date().getMonth(); // 0-11
  revenueByLounge: { name: string; total: number }[] = [];

  constructor(private router: Router, private svc: LoungeBookingService) {}

  ngOnInit(): void {
    this.svc.bookings$.subscribe(bs => {
      this.bookings = bs;
      this.applyFilters();
      this.refreshCharts();
      this.refreshRevenueByLounge();
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
        b.lounge_name,
      ].some(x => x.toLowerCase().includes(q)) ||
      b.total_amount.toString().includes(q) || b.duration_hours.toString().includes(q);

      const matchesPay = this.paymentFilter === 'All' || b.payment_status === this.paymentFilter;
      const matchesStatus = this.statusFilter === 'All' || b.booking_status === this.statusFilter;
      return matchesSearch && matchesPay && matchesStatus;
    });
  }

  clearSearch() { this.searchTerm = ''; this.applyFilters(); }

  updateBooking(b: LoungeBooking) { this.router.navigate(['/lounge-booking/edit', b.booking_id]); }
  deleteBooking(b: LoungeBooking) {
    const ok = confirm(`Delete booking ${b.booking_id}?`);
    if (ok) this.svc.delete(b.booking_id);
  }

  changePaymentStatus(b: LoungeBooking, v: 'Pending'|'Paid'|'Failed') {
    this.svc.update({ ...b, payment_status: v });
  }
  changeBookingStatus(b: LoungeBooking, v: 'Confirmed'|'Pending'|'Cancelled'|'Completed') {
    this.svc.update({ ...b, booking_status: v });
  }

  refreshCharts() {
    this.payStatusCounts = this.svc.countByPaymentStatus();
    this.bookStatusCounts = this.svc.countByBookingStatus();
    this.revenueMonths = this.svc.monthlyRevenue(new Date().getFullYear());
  }

  // Aggregate paid revenue by lounge for current month
  refreshRevenueByLounge() {
    const y = this.currentYear;
    const m = this.currentMonth;
    const acc = new Map<string, number>();
    this.bookings.forEach(b => {
      const d = new Date(b.start_datetime);
      if (b.payment_status === 'Paid' && d.getFullYear() === y && d.getMonth() === m) {
        acc.set(b.lounge_name, (acc.get(b.lounge_name) || 0) + b.total_amount);
      }
    });
    this.revenueByLounge = Array.from(acc.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }

  // Bar chart helpers
  getRevenueMaxForBars(): number {
    return Math.max(1, ...this.revenueByLounge.map(x => x.total));
  }
  getRevenueBarHeight(total: number): number {
    const max = this.getRevenueMaxForBars();
    return (total / max) * 100;
  }

  // Simple inline charts helpers
  getPayCount(key: 'Paid'|'Pending'|'Failed') { return this.payStatusCounts[key] || 0; }
  getBookCount(key: 'Confirmed'|'Pending'|'Cancelled'|'Completed') { return this.bookStatusCounts[key] || 0; }
  getRevenueMax() { return Math.max(1, ...this.revenueMonths); }

  // Helpers to avoid Math.* in template
  private max3(a: number, b: number, c: number): number { return Math.max(1, a, b, c); }
  private max4(a: number, b: number, c: number, d: number): number { return Math.max(1, a, b, c, d); }
  getPayBarHeight(key: 'Paid'|'Pending'|'Failed'): number {
    const paid = this.getPayCount('Paid');
    const pending = this.getPayCount('Pending');
    const failed = this.getPayCount('Failed');
    const max = this.max3(paid, pending, failed) || 1;
    const val = this.getPayCount(key);
    return (val / max) * 100;
  }
  getBookBarHeight(key: 'Confirmed'|'Pending'|'Cancelled'|'Completed'): number {
    const c = this.getBookCount('Confirmed');
    const p = this.getBookCount('Pending');
    const x = this.getBookCount('Cancelled');
    const d = this.getBookCount('Completed');
    const max = this.max4(c, p, x, d) || 1;
    const val = this.getBookCount(key);
    return (val / max) * 100;
  }

  // Build SVG polyline points for revenue chart
  getRevenuePoints(): string {
    const width = 600, height = 220, pad = 30;
    const max = Math.max(1, ...this.revenueMonths);
    const stepX = (width - 2 * pad) / (this.months.length - 1);
    return this.revenueMonths
      .map((v, i) => {
        const x = pad + i * stepX;
        const y = height - pad - (v / max) * (height - 2 * pad);
        return `${x},${y}`;
      })
      .join(' ');
  }

  // Sorting functionality
  onSort(column: string): void {
    if (this.sortColumn === column) {
      // Toggle direction if same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, start with ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    this.filtered = [...this.filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'passenger_id':
          aValue = a.passenger_id.toLowerCase();
          bValue = b.passenger_id.toLowerCase();
          break;
        case 'lounge_name':
          aValue = a.lounge_name.toLowerCase();
          bValue = b.lounge_name.toLowerCase();
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

   getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return ' ⇅'; // Both arrows for unsorted columns
    }
    return this.sortDirection === 'asc' ? ' ↑' : ' ↓';
  }
}
