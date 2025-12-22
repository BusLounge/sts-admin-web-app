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
import { DriverService } from '../../core/services/driver.service';
import { Driver } from '../../core/models/driver.model';

@Component({
  selector: 'app-driver-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BaseChartDirective, NotificationPanelComponent],
  templateUrl: './driver-management.component.html',
  styleUrls: ['./driver-management.component.scss']
})
export class DriverManagementComponent implements OnInit {
  drivers: Driver[] = [];
  filteredDrivers: Driver[] = [];
  searchTerm: string = '';
  statusFilter: 'All' | 'Active' | 'Inactive' = 'All';
  experienceLevels = ['0-2yrs', '3-5yrs', '6-10yrs', '10+yrs'];
  showNotificationPanel = false;

  showAddDriverModal = false;
  isEditing = false;
  editingDriver: Driver | null = null;

  newDriver: Omit<Driver, 'driver_id'> = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    license_number: '',
    experience_years: 0,
    is_active: true,
    license_expiry: '',
    assigned_bus_id: '',
    hire_date: ''
  };

  // Sorting properties
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Chart properties
  barChartData: any;
  barChartOptions: any;
  isBrowser: boolean;

  constructor(private router: Router, private driverService: DriverService, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      Chart.register(...registerables);
    }
    this.driverService.drivers$.subscribe(drivers => {
      this.drivers = drivers;
      this.filteredDrivers = drivers;
      if (this.isBrowser) {
        this.updateBarChart();
      }
      // Apply current sorting to initial data
      if (this.sortColumn) {
        this.applySorting();
      }
    });
  }

  addDriver() {
    this.isEditing = false;
    this.editingDriver = null;
    this.showAddDriverModal = true;
  }

  closeAddDriverModal() {
    this.showAddDriverModal = false;
    this.isEditing = false;
    this.editingDriver = null;
    this.newDriver = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      license_number: '',
      experience_years: 0,
      is_active: true,
      license_expiry: '',
      assigned_bus_id: '',
      hire_date: ''
    };
  }

  saveDriver() {
    if (this.newDriver.first_name && this.newDriver.last_name && this.newDriver.email && this.newDriver.phone && this.newDriver.license_number && this.newDriver.experience_years >= 0) {
      if (this.isEditing && this.editingDriver) {
        const updatedDriver = { ...this.editingDriver, ...this.newDriver };
        this.driverService.updateDriver(updatedDriver);
      } else {
        // Generate a new driver ID
        const newDriverId = this.generateDriverId();
        const driverToAdd: Driver = { ...this.newDriver, driver_id: newDriverId };
        this.driverService.addDriver(driverToAdd);
      }
      this.closeAddDriverModal();
    } else {
      alert('Please fill all required fields');
    }
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

  updateDriver(driver: Driver) {
    this.isEditing = true;
    this.editingDriver = driver;
    this.newDriver = {
      first_name: driver.first_name,
      last_name: driver.last_name,
      email: driver.email,
      phone: driver.phone,
      license_number: driver.license_number,
      experience_years: driver.experience_years,
      is_active: driver.is_active,
      license_expiry: driver.license_expiry,
      assigned_bus_id: driver.assigned_bus_id,
      hire_date: driver.hire_date
    };
    this.showAddDriverModal = true;
  }

  toggleActive(driver: Driver) {
    driver.is_active = !driver.is_active;
    console.log(`${driver.first_name} ${driver.last_name} is now ${driver.is_active ? 'Active' : 'Inactive'}`);
  }

  deleteDriver(driver: Driver) {
    const confirmed = confirm(`Are you sure you want to delete ${driver.first_name} ${driver.last_name}?`);
    if (confirmed) {
      this.driverService.deleteDriver(driver.driver_id);
      console.log(`${driver.first_name} ${driver.last_name} deleted`);
    }
  }

  exportDriversPdf() {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Drivers History', 14, 16);

    const tableHead = [['Driver ID', 'Name', 'Email', 'Phone', 'License No.', 'Experience', 'Status', 'Assigned Bus']];
    const tableBody = this.drivers.map(d => [
      d.driver_id,
      `${d.first_name} ${d.last_name}`,
      d.email,
      this.formatPhone(d.phone),
      d.license_number,
      `${d.experience_years}yrs`,
      d.is_active ? 'Active' : 'Inactive',
      d.assigned_bus_id || 'Unassigned'
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 22,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('drivers-history.pdf');
  }

  // Stats helpers
  getTotalDrivers(): number {
    return this.drivers.length;
  }

  getActiveCount(): number {
    return this.drivers.filter(driver => driver.is_active).length;
  }

  getInactiveCount(): number {
    return this.drivers.filter(driver => !driver.is_active).length;
  }

  getAverageExperience(): number {
    if (this.drivers.length === 0) return 0;
    const total = this.drivers.reduce((sum, driver) => sum + driver.experience_years, 0);
    return Math.round(total / this.drivers.length);
  }

  getActivePercentage(): number {
    const total = this.drivers.length || 1;
    return (this.getActiveCount() / total) * 100;
  }

  getInactivePercentage(): number {
    const total = this.drivers.length || 1;
    return (this.getInactiveCount() / total) * 100;
  }

  getDriverPieBackground(): string {
    const active = this.getActivePercentage();
    return `conic-gradient(#0046FF 0% ${active}%, #FAA533 ${active}% 100%)`;
  }

  getExperienceLevelCount(level: string): number {
    switch (level) {
      case '0-2yrs': return this.drivers.filter(d => d.experience_years >= 0 && d.experience_years <= 2).length;
      case '3-5yrs': return this.drivers.filter(d => d.experience_years >= 3 && d.experience_years <= 5).length;
      case '6-10yrs': return this.drivers.filter(d => d.experience_years >= 6 && d.experience_years <= 10).length;
      case '10+yrs': return this.drivers.filter(d => d.experience_years > 10).length;
      default: return 0;
    }
  }

  getExperienceLevelPercentage(level: string): number {
    const total = this.drivers.length || 1;
    return (this.getExperienceLevelCount(level) / total) * 100;
  }

  // Search and filter functionality
  applyFilters(): void {
    let filtered = this.drivers;

    // Apply status filter
    if (this.statusFilter !== 'All') {
      const isActive = this.statusFilter === 'Active';
      filtered = filtered.filter(driver => driver.is_active === isActive);
    }

    // Apply search term
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(driver =>
        driver.first_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        driver.last_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        driver.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        driver.phone.includes(this.searchTerm) ||
        driver.license_number.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        driver.driver_id.toString().includes(this.searchTerm) ||
        driver.experience_years.toString().includes(this.searchTerm) ||
        driver.assigned_bus_id?.toString().includes(this.searchTerm)
      );
    }

    this.filteredDrivers = filtered;

    // Apply current sorting to filtered results
    if (this.sortColumn) {
      this.applySorting();
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'All';
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  goBusManagement(): void {
    this.router.navigate(['/bus-management']);
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
    this.filteredDrivers = [...this.filteredDrivers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'assigned_bus':
          aValue = a.assigned_bus_id || '';
          bValue = b.assigned_bus_id || '';
          break;
        case 'experience':
          aValue = a.experience_years;
          bValue = b.experience_years;
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

  formatPhone(phone: string): string {
    return `(${phone})`;
  }

  private generateDriverId(): string {
    const existingIds = this.drivers.map(d => d.driver_id);
    let counter = 1;
    let newId = `DRV${counter.toString().padStart(3, '0')}`;
    while (existingIds.includes(newId)) {
      counter++;
      newId = `DRV${counter.toString().padStart(3, '0')}`;
    }
    return newId;
  }
 goUserProfile() {
  this.router.navigate(['/user-profile']);
}
  updateBarChart(): void {
    this.barChartData = {
      labels: ['0-2yrs', '3-5yrs', '6-10yrs', '10+yrs'],
      datasets: [{
        data: [
          this.getExperienceLevelCount('0-2yrs'),
          this.getExperienceLevelCount('3-5yrs'),
          this.getExperienceLevelCount('6-10yrs'),
          this.getExperienceLevelCount('10+yrs')
        ],
        backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
        borderColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
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
}


