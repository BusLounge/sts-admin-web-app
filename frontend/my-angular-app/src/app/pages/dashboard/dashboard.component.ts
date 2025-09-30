
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { BusService } from '../../core/services/bus.service';

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

  busStats = {
    totalBuses: 0,
    activeBuses: 0,
    maintenanceBuses: 0,
    availableBuses: 0
  };

  activeDeg = 0;
  maintenanceDeg = 0;
  availableDeg = 0;

  numBuses = 0;
  numLounges = 0;
  numDrivers = 0;
  numConductors = 0;

  monthlyRevenue = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 55000 },
    { month: 'Jun', revenue: 67000 }
  ];

  recentBookings = [
    { id: 'BK001', route: 'Kathmandu - Pokhara', time: '08:00 AM', status: 'Confirmed' },
    { id: 'BK002', route: 'Pokhara - Chitwan', time: '10:30 AM', status: 'Pending' },
    { id: 'BK003', route: 'Kathmandu - Lumbini', time: '02:15 PM', status: 'Confirmed' },
    { id: 'BK004', route: 'Chitwan - Kathmandu', time: '04:45 PM', status: 'Cancelled' }
  ];

  constructor(private router: Router, private busService: BusService) {}

  ngOnInit(): void {
    this.busService.buses$.subscribe(buses => {
      this.busStats.totalBuses = buses.length;
      this.busStats.activeBuses = buses.filter(bus => bus.is_active).length;
      this.busStats.maintenanceBuses = Math.floor(buses.length * 0.1); // 10% under maintenance
      this.busStats.availableBuses = this.busStats.activeBuses - this.busStats.maintenanceBuses;
      this.numBuses = this.busStats.totalBuses;
    });

    // Hardcoded for now, replace with actual services if available
    this.numLounges = 5;
    this.numDrivers = 20;
    this.numConductors = 15;
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
