import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DriverService } from '../../core/services/driver.service';
import { Driver } from '../../core/models/driver.model';

@Component({
  selector: 'app-driver-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './driver-management.component.html',
  styleUrls: ['./driver-management.component.scss']
})
export class DriverManagementComponent implements OnInit {
  drivers: Driver[] = [];
  filteredDrivers: Driver[] = [];
  searchTerm: string = '';
  experienceLevels = ['0-2yrs', '3-5yrs', '6-10yrs', '10+yrs'];

  constructor(private router: Router, private driverService: DriverService) {}

  ngOnInit(): void {
    this.driverService.drivers$.subscribe(drivers => {
      this.drivers = drivers;
      this.filteredDrivers = drivers;
    });
  }

  addDriver() {
    this.router.navigate(['/driver-management/add']);
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  updateDriver(driver: Driver) {
    this.router.navigate(['/driver-management/edit', driver.driver_id]);
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
      d.phone,
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

  // Search functionality
  onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.filteredDrivers = this.drivers;
    } else {
      this.filteredDrivers = this.drivers.filter(driver =>
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
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredDrivers = this.drivers;
  }

  goBusManagement(): void {
    this.router.navigate(['/bus-management']);
  }
}


