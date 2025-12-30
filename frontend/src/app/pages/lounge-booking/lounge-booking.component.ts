import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { LoungeBookingService } from '../../core/services/lounge-booking.service';
import { LoungeBooking } from '../../core/models/lounge-booking.model';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-lounge-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, NotificationPanelComponent, NavbarComponent],
  templateUrl: './lounge-booking.component.html',
  styleUrls: ['./lounge-booking.component.scss']
})
export class LoungeBookingComponent implements OnInit {
  currentPage = 'lounge-booking';
  isBrowser!: boolean;
  showNotificationPanel = false;
  showProfileMenu = false;


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
  private colors: string[] = ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#8bc34a'];

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
          stepSize: 1
        }
      }
    }
  };

  // Remove pie chart helpers
  // getRevenuePieBackground(): string {
    exportLoungeBookingHistoryPdf(): void {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text('Lounge Booking History', 14, 16);

      const tableHead = [[
        'Booking ID', 'Passenger Name', 'Phone', 'Ref Num', 'Lounge Name', 'Date', 'Time/Duration', 'Guests (A/C)', 'Features', 'Total Amount', 'Payment', 'Status'
      ]];
      const tableBody = this.filtered.map(b => [
        b.booking_id,
        b.passenger_name || '',
        b.passenger_phone || '',
        b.ref_num || '',
        b.lounge_name,
        new Date(b.start_datetime).toLocaleDateString(),
        `${new Date(b.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} / ${b.duration_hours}h`,
        `Adult ${b.adults || 0}, Child ${b.children || 0}`,
        (b.additional_features || []).join(', '),
        `$${b.total_amount}`,
        b.payment_status,
        b.booking_status
      ]);

      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 22,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      });

      doc.save('lounge-booking-history.pdf');
    }
  //   if (this.revenueByLounge.length === 0) return 'conic-gradient(#ccc 0% 100%)';
  //   const total = this.revenueByLounge.reduce((sum, item) => sum + item.total, 0);
  //   let currentPercent = 0;
  //   const gradients = this.revenueByLounge.map((item, index) => {
  //     const percent = (item.total / total) * 100;
  //     const start = currentPercent;
  //     const end = currentPercent + percent;
  //     currentPercent = end;
  //     const color = this.colors[index % this.colors.length];
  //     return `${color} ${start}% ${end}%`;
  //   });
  //   return `conic-gradient(${gradients.join(', ')})`;
  // }
  //
  // getColorForLounge(name: string): string {
  //   const index = this.revenueByLounge.findIndex(item => item.name === name);
  //   return this.colors[index % this.colors.length];
  // }

  constructor(private router: Router, private svc: LoungeBookingService, @Inject(PLATFORM_ID) private platformId: Object, public notificationService: NotificationService) {
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
      this.refreshRevenueByLounge();
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

  applyFilters() {
    const q = this.searchTerm.trim().toLowerCase();
    this.filtered = this.bookings.filter(b => {
      const matchesSearch = !q || [
        b.booking_id,
        b.passenger_id || '',
        b.passenger_name || '',
        b.passenger_phone || '',
        b.ref_num || '',
        b.lounge_name,
        b.payment_status,
        b.booking_status,
        b.start_datetime,
        b.guests.toString(),
        b.adults?.toString() || '',
        b.children?.toString() || '',
        (b.additional_features || []).join(' '),
        b.created_at || ''
      ].some(x => x && x.toLowerCase().includes(q)) ||
      b.total_amount.toString().includes(q) || b.duration_hours.toString().includes(q) || b.capacity_used.toString().includes(q);

      const matchesPay = this.paymentFilter === 'All' || b.payment_status === this.paymentFilter;
      const matchesStatus = this.statusFilter === 'All' || b.booking_status === this.statusFilter;
      return matchesSearch && matchesPay && matchesStatus;
    });
    this.applySorting();
  }

  clearSearch() { this.searchTerm = ''; this.applyFilters(); }

  // Modal state
  showModal = false;
  isEditMode = false;
  formBooking: Partial<LoungeBooking> = {};
  
  availableFeatures = ['Premium meals', 'Express loundary', 'cargo storage', 'spa service', 'personal assist', 'Airport transfer', 'Tuk tuk'];

  openAddModal() {
    this.isEditMode = false;
    this.formBooking = {
      lounge_name: '',
      start_datetime: '',
      duration_hours: 1,
      adults: 1,
      children: 0,
      additional_features: [],
      total_amount: 0,
      payment_status: 'Pending',
      booking_status: 'Confirmed'
    };
    this.showModal = true;
  }

  openEditModal(b: LoungeBooking) {
    this.isEditMode = true;
    this.formBooking = { ...b };
    
    // Format datetime for input (YYYY-MM-DDTHH:mm)
    if (this.formBooking.start_datetime) {
      try {
        this.formBooking.start_datetime = new Date(this.formBooking.start_datetime).toISOString().slice(0, 16);
      } catch (e) {
        console.error('Invalid date format', e);
      }
    }

    // Ensure additional_features is an array
    if (!this.formBooking.additional_features) {
      this.formBooking.additional_features = [];
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveBooking() {
    if (this.isEditMode) {
      this.svc.update(this.formBooking as LoungeBooking);
    } else {
      const newId = 'LBK-' + Math.floor(1000 + Math.random() * 9000);
      const newBooking = { 
        ...this.formBooking, 
        booking_id: newId,
        passenger_id: 'PAS-' + Math.floor(100 + Math.random() * 900), // Auto-gen for now
        capacity_used: (this.formBooking.adults || 0) + (this.formBooking.children || 0),
        created_at: new Date().toISOString()
      } as LoungeBooking;
      this.svc.add(newBooking);
    }
    this.closeModal();
  }

  toggleFeature(feature: string) {
    const features = this.formBooking.additional_features || [];
    if (features.includes(feature)) {
      this.formBooking.additional_features = features.filter(f => f !== feature);
    } else {
      this.formBooking.additional_features = [...features, feature];
    }
  }

  isFeatureSelected(feature: string): boolean {
    return (this.formBooking.additional_features || []).includes(feature);
  }

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
  //notification panel
  toggleNotificationPanel() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel() {
    this.showNotificationPanel = false;
  }

  // Aggregate total revenue by lounge
  refreshRevenueByLounge() {
    const acc = new Map<string, number>();
    this.bookings.forEach(b => {
      acc.set(b.lounge_name, (acc.get(b.lounge_name) || 0) + b.total_amount);
    });
    this.revenueByLounge = Array.from(acc.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
    this.updateChartData();
  }

  updateChartData() {
    this.barChartData = [
      {
        labels: ['Paid', 'Pending', 'Failed'],
        datasets: [{
          data: [this.payStatusCounts['Paid'] || 0, this.payStatusCounts['Pending'] || 0, this.payStatusCounts['Failed'] || 0],
          backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533'],
          borderColor: ['#0046FF', '#a3a3a3', '#FAA533'],
          borderWidth: 0.25
        }]
      },
      {
        labels: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
        datasets: [{
          data: [this.bookStatusCounts['Confirmed'] || 0, this.bookStatusCounts['Pending'] || 0, this.bookStatusCounts['Cancelled'] || 0, this.bookStatusCounts['Completed'] || 0],
          backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533', '#6db9f8ff'],
          borderColor: ['#0046FF', '#a3a3a3', '#FAA533', '#6db9f8ff'],
          borderWidth: 0.25
        }]
      },
      {
        labels: this.revenueByLounge.map(item => item.name),
        datasets: [{
          data: this.revenueByLounge.map(item => item.total),
          backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533', '#6db9f8ff'],
          borderColor: ['#0046FF', '#a3a3a3', '#FAA533', '#6db9f8ff'],
          borderWidth: 0.25
        }]
      }
    ];
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_user');
    this.router.navigate(['/login']);
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
        case 'booking_id':
          aValue = a.booking_id.toLowerCase();
          bValue = b.booking_id.toLowerCase();
          break;
        case 'passenger_name':
          aValue = a.passenger_name?.toLowerCase() || '';
          bValue = b.passenger_name?.toLowerCase() || '';
          break;
        case 'passenger_phone':
          aValue = a.passenger_phone?.toLowerCase() || '';
          bValue = b.passenger_phone?.toLowerCase() || '';
          break;
        case 'ref_num':
          aValue = a.ref_num?.toLowerCase() || '';
          bValue = b.ref_num?.toLowerCase() || '';
          break;
        case 'lounge_name':
          aValue = a.lounge_name.toLowerCase();
          bValue = b.lounge_name.toLowerCase();
          break;
        case 'start_datetime':
          aValue = new Date(a.start_datetime).getTime();
          bValue = new Date(b.start_datetime).getTime();
          break;
        case 'duration':
          aValue = a.duration_hours;
          bValue = b.duration_hours;
          break;
        case 'guests':
          aValue = (a.adults || 0) + (a.children || 0);
          bValue = (b.adults || 0) + (b.children || 0);
          break;
        case 'additional_features':
          aValue = (a.additional_features || []).join(', ').toLowerCase();
          bValue = (b.additional_features || []).join(', ').toLowerCase();
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'payment_status':
          aValue = a.payment_status.toLowerCase();
          bValue = b.payment_status.toLowerCase();
          break;
        case 'booking_status':
          aValue = a.booking_status.toLowerCase();
          bValue = b.booking_status.toLowerCase();
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

  // Pie chart helpers for revenue by lounge
  getRevenuePieBackground(): string {
    if (this.revenueByLounge.length === 0) return 'conic-gradient(#ccc 0% 100%)';
    const total = this.revenueByLounge.reduce((sum, item) => sum + item.total, 0);
    let currentPercent = 0;
    const gradients = this.revenueByLounge.map((item, index) => {
      const percent = (item.total / total) * 100;
      const start = currentPercent;
      const end = currentPercent + percent;
      currentPercent = end;
      const color = this.colors[index % this.colors.length];
      return `${color} ${start}% ${end}%`;
    });
    return `conic-gradient(${gradients.join(', ')})`;
  }

  getColorForLounge(name: string): string {
    const index = this.revenueByLounge.findIndex(item => item.name === name);
    return this.colors[index % this.colors.length];
  }
}
