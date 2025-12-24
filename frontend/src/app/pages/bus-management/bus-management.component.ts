import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
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
  imports: [CommonModule, FormsModule, NavbarComponent, BaseChartDirective, NotificationPanelComponent],
  templateUrl: './bus-management.component.html',
  styleUrls: ['./bus-management.component.scss']
})
export class BusManagementComponent implements OnInit {
  buses: Bus[] = [];
  filteredBuses: Bus[] = [];
  searchTerm: string = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  currentPage: string = 'bus-management';
  showNotificationPanel = false;

  showAddBusModal = false;
  showEditBusModal = false;

  newBus: Omit<Bus, 'bus_id'> = {
    bus_number: '',
    company: '',
    contact: '',
    permitNum: '',
    regnum: '',
    capacity: 0,
    type: 'AC',
    assigned_route_id: '',
    approvedFare: 0,
    is_active: true,
    verificationStatus: 'Pending',
    documents: []
  };

  selectedBus: Bus | null = null;

  // Document upload properties
  showDocumentModal = false;
  selectedBusForDocuments: Bus | null = null;
  selectedFiles: File[] = [];
  selectedDocumentType: string = '';

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

  goUserProfile() {
    this.router.navigate(['/user-profile']);
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
      company: '',
      contact: '',
      permitNum: '',
      regnum: '',
      capacity: 0,
      type: 'AC',
      assigned_route_id: '',
      approvedFare: 0,
      is_active: true,
      verificationStatus: 'Pending',
      documents: []
    };
  }

  saveBus() {
    if (this.newBus.bus_number && this.newBus.company && this.newBus.contact && this.newBus.permitNum && this.newBus.regnum && this.newBus.capacity > 0 && this.newBus.assigned_route_id && this.newBus.approvedFare >= 0) {
      this.busService.addBus(this.newBus);
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
    if (this.selectedBus && this.selectedBus.bus_number && this.selectedBus.company && this.selectedBus.contact && this.selectedBus.permitNum && this.selectedBus.regnum && this.selectedBus.capacity > 0 && this.selectedBus.assigned_route_id && this.selectedBus.approvedFare >= 0) {
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

    const tableHead = [['Bus ID', 'Company', 'Contact', 'Permit Num', 'Reg Num', 'Bus Type', 'Seats', 'Route', 'Approved Fare', 'Status', 'Verification Status']];
    const tableBody = this.buses.map(b => [
      b.bus_id,
      b.company,
      b.contact,
      b.permitNum,
      b.regnum,
      b.type,
      String(b.capacity),
      b.assigned_route_id,
      String(b.approvedFare),
      b.is_active ? 'Active' : 'Inactive',
      b.verificationStatus
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 22,
      styles: { fontSize: 8 },
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
        case 'bus_id':
          aValue = a.bus_id;
          bValue = b.bus_id;
          break;
        case 'company':
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
          break;
        case 'contact':
          aValue = a.contact.toLowerCase();
          bValue = b.contact.toLowerCase();
          break;
        case 'permitNum':
          aValue = a.permitNum.toLowerCase();
          bValue = b.permitNum.toLowerCase();
          break;
        case 'regnum':
          aValue = a.regnum.toLowerCase();
          bValue = b.regnum.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'capacity':
          aValue = a.capacity;
          bValue = b.capacity;
          break;
        case 'route_id':
          aValue = a.assigned_route_id || '';
          bValue = b.assigned_route_id || '';
          break;
        case 'approvedFare':
          aValue = a.approvedFare;
          bValue = b.approvedFare;
          break;
        case 'is_active':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case 'verificationStatus':
          aValue = a.verificationStatus.toLowerCase();
          bValue = b.verificationStatus.toLowerCase();
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

  // Getters and setters for documents field to handle string/array conversion
  get newBusDocuments(): string {
    return this.newBus.documents ? this.newBus.documents.join(', ') : '';
  }

  set newBusDocuments(value: string) {
    this.newBus.documents = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
  }

  get selectedBusDocuments(): string {
    return this.selectedBus?.documents ? this.selectedBus.documents.join(', ') : '';
  }

  set selectedBusDocuments(value: string) {
    if (this.selectedBus) {
      this.selectedBus.documents = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
    }
  }

  // Document upload modal methods
  closeDocumentModal() {
    this.showDocumentModal = false;
    this.selectedBusForDocuments = null;
    this.selectedFiles = [];
    this.selectedDocumentType = '';
  }

  uploadDocuments() {
    if (this.selectedFiles.length > 0 && this.selectedDocumentType && this.selectedBusForDocuments) {
      // TODO: Implement actual file upload logic
      console.log('Uploading documents for bus:', this.selectedBusForDocuments.bus_number);
      console.log('Document type:', this.selectedDocumentType);
      console.log('Files:', this.selectedFiles);
      this.closeDocumentModal();
    }
  }

  onFileSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }
}
