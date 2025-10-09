
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { BusService } from '../../core/services/bus.service';
import { LoungeService } from '../../core/services/lounge.service';
import { DriverService } from '../../core/services/driver.service';
import { ConductorService } from '../../core/services/conductor.service';
import { BusBookingService } from '../../core/services/bus-booking.service';
import { LoungeBookingService } from '../../core/services/lounge-booking.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  sidebarOpen = true;
  currentPage = 'dashboard';

  numBuses = 0;
  numLounges = 0;
  numDrivers = 0;
  numConductors = 0;

  // Chart data
  busStatusCounts: Record<string, number> = {};
  driverStatusCounts: Record<string, number> = {};
  conductorStatusCounts: Record<string, number> = {};
  loungeRevenueByLounge: { name: string; total: number }[] = [];
  busMonthlyRevenue: number[] = [];
  months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  private colors: string[] = ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#8bc34a'];

  constructor(
    private router: Router,
    private busService: BusService,
    private loungeService: LoungeService,
    private driverService: DriverService,
    private conductorService: ConductorService,
    private busBookingService: BusBookingService,
    private loungeBookingService: LoungeBookingService
  ) {}

  ngOnInit(): void {
    this.busService.buses$.subscribe(buses => {
      this.numBuses = buses.length;
      this.busStatusCounts = this.countBusStatus(buses);
    });

    this.loungeService.lounges$.subscribe(lounges => {
      this.numLounges = lounges.length;
    });

    this.driverService.drivers$.subscribe(drivers => {
      this.numDrivers = drivers.length;
      this.driverStatusCounts = this.countDriverStatus(drivers);
    });

    this.conductorService.conductors$.subscribe(conductors => {
      this.numConductors = conductors.length;
      this.conductorStatusCounts = this.countConductorStatus(conductors);
    });

    this.busBookingService.bookings$.subscribe(bookings => {
      // Calculate total fare for each month for paid bookings
      const monthlyTotals = Array(12).fill(0);
      bookings.forEach(b => {
        if (b.payment_status === 'Paid') {
          const month = new Date(b.journey_datetime).getMonth();
          monthlyTotals[month] += b.total_fare;
        }
      });
      this.busMonthlyRevenue = monthlyTotals;
    });

    this.loungeBookingService.bookings$.subscribe(bookings => {
      this.loungeRevenueByLounge = this.computeLoungeRevenue(bookings);
    });
  }

  private countBusStatus(buses: any[]): Record<string, number> {
    const map: Record<string, number> = { Active: 0, Inactive: 0 };
    buses.forEach(b => map[b.is_active ? 'Active' : 'Inactive']++);
    return map;
  }

  private countDriverStatus(drivers: any[]): Record<string, number> {
    const map: Record<string, number> = { Active: 0, Inactive: 0 };
    drivers.forEach(d => map[d.is_active ? 'Active' : 'Inactive']++);
    return map;
  }

  private countConductorStatus(conductors: any[]): Record<string, number> {
    const map: Record<string, number> = { Active: 0, 'On Leave': 0, Resigned: 0 };
    conductors.forEach(c => map[c.status] = (map[c.status] || 0) + 1);
    return map;
  }

  private computeLoungeRevenue(bookings: any[]): { name: string; total: number }[] {
    const map: Record<string, number> = {};
    bookings.forEach(b => {
      map[b.lounge_name] = (map[b.lounge_name] || 0) + b.total_amount;
    });
    return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }

  getBusActivePercentage(): number {
    const total = this.busStatusCounts['Active'] + this.busStatusCounts['Inactive'];
    return total ? (this.busStatusCounts['Active'] / total) * 100 : 0;
  }

  getBusInactivePercentage(): number {
    const total = this.busStatusCounts['Active'] + this.busStatusCounts['Inactive'];
    return total ? (this.busStatusCounts['Inactive'] / total) * 100 : 0;
  }

  getBusPieBackground(): string {
    const active = this.getBusActivePercentage();
    return `conic-gradient(#4caf50 0% ${active}%, #f87171 ${active}% 100%)`;
  }

  getDriverPieBackground(): string {
    const active = this.getDriverActivePercentage();
    return `conic-gradient(#4caf50 0% ${active}%, #f87171 ${active}% 100%)`;
  }

  getDriverActivePercentage(): number {
    const total = this.driverStatusCounts['Active'] + this.driverStatusCounts['Inactive'];
    return total ? (this.driverStatusCounts['Active'] / total) * 100 : 0;
  }

  getDriverInactivePercentage(): number {
    const total = this.driverStatusCounts['Active'] + this.driverStatusCounts['Inactive'];
    return total ? (this.driverStatusCounts['Inactive'] / total) * 100 : 0;
  }

  getConductorActivePercentage(): number {
    const total = Object.values(this.conductorStatusCounts).reduce((a, b) => a + b, 0);
    return total ? (this.conductorStatusCounts['Active'] / total) * 100 : 0;
  }

  getConductorOnLeavePercentage(): number {
    const total = Object.values(this.conductorStatusCounts).reduce((a, b) => a + b, 0);
    return total ? (this.conductorStatusCounts['On Leave'] / total) * 100 : 0;
  }

  getConductorResignedPercentage(): number {
    const total = Object.values(this.conductorStatusCounts).reduce((a, b) => a + b, 0);
    return total ? (this.conductorStatusCounts['Resigned'] / total) * 100 : 0;
  }

  getConductorPieBackground(): string {
    const active = this.getConductorActivePercentage();
    const onLeave = this.getConductorOnLeavePercentage();
    const resigned = this.getConductorResignedPercentage();
    const activeEnd = active;
    const onLeaveEnd = active + onLeave;
    return `conic-gradient(#4caf50 0% ${activeEnd}%, #fbbf24 ${activeEnd}% ${onLeaveEnd}%, #9ca3af ${onLeaveEnd}% 100%)`;
  }

  getRevenuePoints(): string {
    const max = Math.max(...this.busMonthlyRevenue, 1);
    return this.busMonthlyRevenue.map((v, i) => `${i * 50 + 50},${260 - (v / max) * 200}`).join(' ');
  }

  getLoungeRevenueBarHeight(total: number): number {
    const max = Math.max(...this.loungeRevenueByLounge.map(i => i.total), 1);
    return (total / max) * 100;
  }

  getColorForLounge(name: string): string {
    const index = this.loungeRevenueByLounge.findIndex(item => item.name === name);
    return this.colors[index % this.colors.length];
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  navigateTo(page: string): void {
    this.currentPage = page;
    this.router.navigate([`/${page}`]);
  }

  logout(): void {
    this.router.navigate(['/']);
  }
}
