import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BusService } from '../../core/services/bus.service';

import { Bus } from '../../core/models/bus.model';

@Component({
  selector: 'app-bus-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './bus-management.component.html',
  styleUrls: ['./bus-management.component.scss']
})
export class BusManagementComponent implements OnInit {
  buses: Bus[] = [];
  filteredBuses: Bus[] = [];
  searchTerm: string = '';
  sidebarOpen: boolean = true;
  currentPage: string = 'bus-management';

  constructor(private router: Router, private busService: BusService) {}

  ngOnInit(): void {
    this.busService.buses$.subscribe(buses => {
      this.buses = buses;
      this.filteredBuses = buses;
    });
  }

  addBus() {
    this.router.navigate(['/bus-management/add']);
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  updateBus(bus: Bus) {
    this.router.navigate(['/bus-management/edit', bus.bus_id]);
  }

  toggleActive(bus: Bus) {
    bus.is_active = !bus.is_active;
    console.log(`${bus.bus_number} is now ${bus.is_active ? 'Active' : 'Inactive'}`);
    // Call backend API to update is_active status
  }

  deleteBus(bus: Bus) {
    const confirmed = confirm(`Are you sure you want to delete ${bus.bus_number}?`);
    if (confirmed) {
      this.busService.deleteBus(bus.bus_id);
      console.log(`${bus.bus_number} deleted`);
    }
  }

  exportHistoryPdf() {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Buses History', 14, 16);

    const tableHead = [['Bus ID', 'Bus Number', 'Capacity', 'Type', 'Status', 'Route ID']];
    const tableBody = this.buses.map(b => [
      b.bus_id,
      b.bus_number,
      String(b.capacity),
      b.type,
      b.is_active ? 'Active' : 'Inactive',
      b.assigned_route_id
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 22,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('buses-history.pdf');
  }

  // Stats helpers to keep template simple (no arrow functions in template)
  getTotalBuses(): number {
    return this.buses.length;
  }

  getActiveCount(): number {
    return this.buses.filter(bus => bus.is_active).length;
  }

  getInactiveCount(): number {
    return this.buses.filter(bus => !bus.is_active).length;
  }

  getAverageCapacity(): number {
    if (this.buses.length === 0) return 0;
    const total = this.buses.reduce((sum, bus) => sum + bus.capacity, 0);
    return Math.round(total / this.buses.length);
  }

  getTotalCapacity(): number {
    return this.buses.reduce((sum, bus) => sum + bus.capacity, 0);
  }

  getCapacityByType(type: string): number {
    return this.buses
      .filter(bus => bus.type === type)
      .reduce((sum, bus) => sum + bus.capacity, 0);
  }

  getCapacityByTypePercentage(type: string): number {
    const total = this.getTotalCapacity() || 1;
    return (this.getCapacityByType(type) / total) * 100;
  }

  getActivePercentage(): number {
    const total = this.buses.length || 1;
    return (this.getActiveCount() / total) * 100;
  }

  getInactivePercentage(): number {
    const total = this.buses.length || 1;
    return (this.getInactiveCount() / total) * 100;
  }

  // Search functionality
  onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.filteredBuses = this.buses;
    } else {
      this.filteredBuses = this.buses.filter(bus =>
        bus.bus_number.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        bus.bus_id.toString().includes(this.searchTerm) ||
        bus.type.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        bus.assigned_route_id?.toString().includes(this.searchTerm) ||
        bus.capacity.toString().includes(this.searchTerm)
      );
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredBuses = this.buses;
  }

  goDriverManagement(): void {
    this.router.navigate(['/driver-management']);
  }

  goPassengerManagement(): void {
    this.router.navigate(['/passenger-management']);
  }

  goLounges(): void {
    this.router.navigate(['/lounges']);
  }

  goPassengerReports(): void {
    this.router.navigate(['/scheduling']);
  }

  onNavigate(page: string): void { this.router.navigate([`/${page}`]); }
  onLogout(): void { this.router.navigate(['/']); }
}
