import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  sidebarOpen = true;
  currentPage = 'dashboard';

  // Mock data for charts
  busStats = {
    totalBuses: 24,
    activeBuses: 18,
    maintenanceBuses: 4,
    availableBuses: 2
  };

  recentBookings = [
    { id: 'BK001', route: 'City A → City B', time: '10:30 AM', status: 'Confirmed' },
    { id: 'BK002', route: 'City C → City D', time: '2:15 PM', status: 'Pending' },
    { id: 'BK003', route: 'City E → City F', time: '4:45 PM', status: 'Confirmed' },
    { id: 'BK004', route: 'City G → City H', time: '6:20 PM', status: 'Cancelled' }
  ];

  monthlyRevenue = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 55000 },
    { month: 'Jun', revenue: 67000 }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    // Initialize dashboard
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  navigateTo(page: string) {
    this.currentPage = page;
    // For now, just show alert since other pages aren't implemented yet
    if (page !== 'dashboard') {
      alert(`${page.charAt(0).toUpperCase() + page.slice(1)} management page will be implemented soon!`);
    }
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
