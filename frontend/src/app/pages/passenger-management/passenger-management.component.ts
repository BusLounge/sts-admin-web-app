import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { PassengerService } from '../../core/services/passenger.service';
import { Passenger } from '../../core/models/passenger.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-passenger-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, NotificationPanelComponent],
  templateUrl: './passenger-management.component.html',
  styleUrls: ['./passenger-management.component.scss']
})
export class PassengerManagementComponent implements OnInit {
  passengers: Passenger[] = [];
  filteredPassengers: Passenger[] = [];
  searchTerm = '';
  currentPage: string = 'passenger-management';  // default page
  showNotificationPanel = false;
  // Sorting properties
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';


  monthlyCounts: number[] = [];
  months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  constructor(private router: Router, private passengerService: PassengerService) {}

  ngOnInit(): void {
    this.passengerService.passengers$.subscribe(ps => {
      this.passengers = ps;
      this.filteredPassengers = ps;
      this.refreshChart();
    });
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

  showAddPassengerModal: boolean = false;
  newPassenger: Partial<Passenger> = {};

  showUpdatePassengerModal: boolean = false;
  selectedPassenger: Passenger | null = null;

  addPassenger(): void {
    this.showAddPassengerModal = true;
    this.newPassenger = {};
  }

  closeAddPassengerModal(): void {
    this.showAddPassengerModal = false;
    this.newPassenger = {};
  }

  savePassenger(): void {
    if (this.newPassenger.name && this.newPassenger.phone && this.newPassenger.email && this.newPassenger.nic) {
      this.passengerService.addPassenger(this.newPassenger as Passenger);
      this.closeAddPassengerModal();
    }
  }

  updatePassenger(p: Passenger): void {
    this.selectedPassenger = { ...p };
    this.showUpdatePassengerModal = true;
  }

  closeUpdatePassengerModal(): void {
    this.showUpdatePassengerModal = false;
    this.selectedPassenger = null;
  }

  saveUpdatedPassenger(): void {
    if (this.selectedPassenger && this.selectedPassenger.name && this.selectedPassenger.phone && this.selectedPassenger.email && this.selectedPassenger.nic) {
      this.passengerService.updatePassenger(this.selectedPassenger);
      this.closeUpdatePassengerModal();
    }
  }

  deletePassenger(p: Passenger): void {
    const ok = confirm(`Delete ${p.name}?`);
    if (ok) this.passengerService.deletePassenger(p.passenger_id);
  }

  onSearchChange(): void {
    const q = this.searchTerm.toLowerCase();
    this.filteredPassengers = !q ? this.passengers : this.passengers.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.nic.toLowerCase().includes(q) ||
      p.passenger_id.toLowerCase().includes(q)
    );
  }
  
  clearSearch(): void { this.searchTerm = ''; this.filteredPassengers = this.passengers; }

  refreshChart(): void { this.monthlyCounts = this.passengerService.getMonthlyCounts(new Date().getFullYear()); }
    // 🚀 Export PDF Function
  exportHistoryPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Passenger History Report', 14, 15);

    autoTable(doc, {
      head: [['Passenger ID', 'Name', 'Phone', 'Email', 'NIC', 'Created']],
      body: this.filteredPassengers.map(p => [
        p.passenger_id,
        p.name,
        p.phone,
        p.email,
        p.nic,
        new Date(p.created_at).toISOString().split('T')[0]
      ]),
      startY: 25,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, // blue header
    });

    doc.save('Passenger_History.pdf');
  }


  // Helpers for inline SVG chart
  getMaxCount(): number { return Math.max(1, ...this.monthlyCounts); }
  getPoints(): string {
    const width = 600, height = 220, padding = 30;
    const max = this.getMaxCount();
    const stepX = (width - padding * 2) / (this.months.length - 1);
    return this.monthlyCounts
      .map((c, i) => {
        const x = padding + i * stepX;
        const y = height - padding - (c / max) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }

  onLogout() {
    // Example logout logic
    localStorage.removeItem('token');
    this.router.navigate(['/']);
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
    this.filteredPassengers = [...this.filteredPassengers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
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
