import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BusService } from '../../core/services/bus.service';


import { Bus } from '../../core/models/bus.model';

@Component({
  selector: 'app-bus-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, BaseChartDirective, NotificationPanelComponent],
  templateUrl: './bus-management.component.html',
  styleUrls: ['./bus-management.component.scss']
})
export class BusManagementComponent implements OnInit {
  buses: Bus[] = [];
  filteredBuses: Bus[] = [];
  searchTerm: string = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  sidebarOpen: boolean = true;
  currentPage: string = 'bus-management';
  showNotificationPanel = false;

  showAddBusModal = false;
  showEditBusModal = false;

  newBus: Omit<Bus, 'bus_id'> = {
    bus_number: '',
    capacity: 0,
    type: 'AC',
    is_active: true,
    assigned_route_id: ''
  };

  selectedBus: Bus | null = null;

  // Sorting properties
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Chart properties
  barChartData: any;
  barChartOptions: any;
  isBrowser: boolean;

  constructor(private router: Router, private busService: BusService, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      Chart.register(...registerables);
    }
    this.busService.buses$.subscribe(buses => {
      this.buses = buses;
      this.applyFilters();
      if (this.isBrowser) {
        this.updateBarChart();
      }
    });
  }

 

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  toggleNotificationPanel() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel() {
    this.showNotificationPanel = false;
  }

  addBus() {
    this.showAddBusModal = true;
  }

  closeAddBusModal() {
    this.showAddBusModal = false;
    this.newBus = {
      bus_number: '',
      capacity: 0,
      type: 'AC',
      is_active: true,
      assigned_route_id: ''
    };
  }

  saveBus() {
    if (this.newBus.bus_number && this.newBus.capacity > 0 && this.newBus.assigned_route_id) {
      this.busService.addBus({
        bus_number: this.newBus.bus_number,
        capacity: this.newBus.capacity,
        type: this.newBus.type,
        is_active: this.newBus.is_active,
        assigned_route_id: this.newBus.assigned_route_id
      });
      this.closeAddBusModal();
    } else {
      alert('Please fill all required fields');
    }
  }

  closeEditBusModal() {
    this.showEditBusModal = false;
    this.selectedBus = null;
  }

  saveEditBus() {
    if (this.selectedBus && this.selectedBus.bus_number && this.selectedBus.capacity > 0 && this.selectedBus.assigned_route_id) {
      this.busService.updateBus(this.selectedBus);
      this.closeEditBusModal();
    } else {
      alert('Please fill all required fields');
    }
  }

  updateBus(bus: Bus) {
    this.selectedBus = { ...bus };
    this.showEditBusModal = true;
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

  getBusCountByType(type: string): number {
    return this.buses.filter(bus => bus.type === type).length;
  }

  getBusCountByTypePercentage(type: string): number {
    const total = this.buses.length || 1;
    return (this.getBusCountByType(type) / total) * 100;
  }

  getActivePercentage(): number {
    const total = this.buses.length || 1;
    return (this.getActiveCount() / total) * 100;
  }

  getInactivePercentage(): number {
    const total = this.buses.length || 1;
    return (this.getInactiveCount() / total) * 100;
  }

  getBusPieBackground(): string {
    const active = this.getActivePercentage();
    return `conic-gradient(#0046FF 0% ${active}%, #FAA533 ${active}% 100%)`;
  }

  updateBarChart(): void {
    this.barChartData = {
      labels: ['AC', 'Non-AC', 'Luxury'],
      datasets: [{
        data: [
          this.getBusCountByType('AC'),
          this.getBusCountByType('Non-AC'),
          this.getBusCountByType('Luxury')
        ],
        backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533'],
        borderColor: ['#0046FF', '#a3a3a3', '#FAA533'],
        borderWidth: 0.25
      }]
    };
    this.barChartOptions = {
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
  }

  // Search functionality
  onSearchChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  // Filter functionality
  onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = this.buses;

    // Apply search filter
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(bus =>
        bus.bus_number.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        bus.bus_id.toString().includes(this.searchTerm) ||
        bus.type.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        bus.assigned_route_id?.toString().includes(this.searchTerm) ||
        bus.capacity.toString().includes(this.searchTerm)
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(bus => bus.is_active === (this.statusFilter === 'active'));
    }

    this.filteredBuses = filtered;

    // Apply current sorting to filtered results
    if (this.sortColumn) {
      this.applySorting();
    }
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
    this.filteredBuses = [...this.filteredBuses].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'capacity':
          aValue = a.capacity;
          bValue = b.capacity;
          break;
        case 'bus_number':
          aValue = a.bus_number.toLowerCase();
          bValue = b.bus_number.toLowerCase();
          break;
        case 'route_id':
          aValue = a.assigned_route_id || '';
          bValue = b.assigned_route_id || '';
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
