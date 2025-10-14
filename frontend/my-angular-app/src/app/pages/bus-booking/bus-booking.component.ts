import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { BusBookingService } from '../../core/services/bus-booking.service';
import { BusBooking } from '../../core/models/bus-booking.model';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-bus-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, BaseChartDirective, NotificationPanelComponent],
  templateUrl: './bus-booking.component.html',
  styleUrls: ['./bus-booking.component.scss']
})
export class BusBookingComponent implements OnInit {
  sidebarOpen = true;
  currentPage = 'bus-booking';
  isBrowser!: boolean;
  showNotificationPanel = false;

  bookings: BusBooking[] = [];
  filtered: BusBooking[] = [];
  searchTerm = '';

  paymentFilter: 'All' | 'Pending' | 'Paid' | 'Failed' | 'Refunded' = 'All';
  statusFilter: 'All' | 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed' = 'All';

  // Sorting properties
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Chart data
  payStatusCounts: Record<string, number> = {};
  bookStatusCounts: Record<string, number> = {};
  revenueMonths: number[] = [];
  months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Chart.js data
  barChartData: any[] = [];
  barChartOptions: any = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10
        }
      }
    }
  };

  // Modal properties
  showEditModal = false;
  selectedBooking: BusBooking | null = null;
  formSeatNumbers = '';

  // Expose Math to template
  Math = Math;

  constructor(private router: Router, private svc: BusBookingService, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      Chart.register(...registerables);
    }
  }

  ngOnInit(): void {
    this.svc.bookings$.subscribe(bs => {
      this.bookings = bs;
      this.applyFilters();
      this.refreshCharts();
      this.updateChartData();
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

  goDashboard() {
    this.currentPage = 'dashboard';
    this.router.navigate(['/dashboard']);
  }

  toggleNotificationPanel() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel() {
    this.showNotificationPanel = false;
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
  updateBooking(b: BusBooking) {
    this.selectedBooking = { ...b };
    this.formSeatNumbers = b.seat_numbers.join(', ');
    this.showEditModal = true;
  }
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
    return this.revenueMonths.map((v, i) => `${i * 50 + 50},${260 - (v / max) * 200}`).join(' ');
  }

  getYAxisLabels(): { value: string, y: number }[] {
    const max = Math.max(1, ...this.revenueMonths);
    const steps = [0, 0.25, 0.5, 0.75, 1];
    return steps.map(f => {
      const val = f * max;
      const y = 260 - (val / max) * 200;
      return { value: Math.round(val).toString(), y };
    });
  }

  onPaymentStatusChange(booking: BusBooking): void {
    console.log('Payment status changed:', booking);
    // Update charts after payment status change
    this.refreshCharts();
    this.updateChartData();
    // Add your update logic here, e.g., call API to update backend
  }

  onBookingStatusChange(booking: BusBooking): void {
    console.log('Booking status changed:', booking);
    // Update charts after booking status change
    this.refreshCharts();
    this.updateChartData();
    // Add your update logic here, e.g., call API to update backend
  }

  updateChartData() {
    this.barChartData = [
      {
        labels: ['Paid', 'Pending', 'Failed', 'Refunded'],
        datasets: [{
          data: [this.payStatusCounts['Paid'] || 0, this.payStatusCounts['Pending'] || 0, this.payStatusCounts['Failed'] || 0, this.payStatusCounts['Refunded'] || 0],
          backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
          borderColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
          borderWidth: 0.25
        }]
      },
      {
        labels: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
        datasets: [{
          data: [this.bookStatusCounts['Confirmed'] || 0, this.bookStatusCounts['Pending'] || 0, this.bookStatusCounts['Cancelled'] || 0, this.bookStatusCounts['Completed'] || 0],
          backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
          borderColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
          borderWidth: 0.25
        }]
      },
      {
        labels: this.months,
        datasets: [{
          data: this.revenueMonths,
          backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B', '#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B', '#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
          borderColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B', '#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B', '#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
          borderWidth: 0.25
        }]
      }
    ];
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
        case 'bus_number':
          aValue = a.bus_number.toLowerCase();
          bValue = b.bus_number.toLowerCase();
          break;
        case 'route':
          aValue = `${a.from} → ${a.to}`.toLowerCase();
          bValue = `${b.from} → ${b.to}`.toLowerCase();
          break;
        case 'journey_datetime':
          aValue = new Date(a.journey_datetime);
          bValue = new Date(b.journey_datetime);
          break;
        case 'seats_booked':
          aValue = a.seats_booked;
          bValue = b.seats_booked;
          break;
        case 'total_fare':
          aValue = a.total_fare;
          bValue = b.total_fare;
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

  // Modal methods
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedBooking = null;
  }

  saveEditBooking(): void {
    if (!this.selectedBooking) return;
    this.selectedBooking.seat_numbers = this.formSeatNumbers.split(',').map(s => s.trim());
    this.svc.update(this.selectedBooking);
    this.closeEditModal();
  }
}
