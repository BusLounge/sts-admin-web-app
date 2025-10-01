
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

  numBuses = 0;
  numLounges = 0;
  numDrivers = 0;
  numConductors = 0;

  constructor(private router: Router, private busService: BusService) {}

  ngOnInit(): void {
    this.busService.buses$.subscribe(buses => {
      this.numBuses = buses.length;
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
