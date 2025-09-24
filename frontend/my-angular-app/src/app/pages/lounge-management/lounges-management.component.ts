import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { Lounge } from '../../core/models/lounge.model';
import { LoungeService } from '../../core/services/lounge.service';

@Component({
  selector: 'app-lounges-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './lounges-management.component.html',
  styleUrls: ['./lounges-management.component.scss']
})
export class LoungesManagementComponent implements OnInit {
  lounges: Lounge[] = [];
  filteredLounges: Lounge[] = [];
  searchTerm = '';

  amenitiesCounts: { label: string; count: number }[] = [];
  servicesCounts: { label: string; count: number }[] = [];

  sidebarOpen = true;
  currentPage = 'lounges';

  // Sorting properties
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private router: Router, private loungeService: LoungeService) {}

  ngOnInit(): void {
    this.currentPage = 'lounges-management'; // Set currentPage to match sidebar item key
    this.loungeService.lounges$.subscribe(ls => {
      this.lounges = ls;
      this.filteredLounges = ls;
      this.refreshCharts();
    });
  }

  // New method to get data for Capacity vs Price chart
  getCapacityPriceData() {
    return this.lounges.map(lounge => ({
      name: lounge.name,
      capacity: lounge.capacity,
      price_per_hour: lounge.price_per_hour
    }));
  }

  // New method to get data for Food, Drinks, Shower chart
  getFoodDrinksShowerData() {
    const servicesCounts = this.loungeService.getServicesCounts();
    const filtered = Object.entries(servicesCounts).filter(([label]) =>
      ['Food', 'Drinks', 'Shower'].includes(label)
    ).map(([label, count]) => ({ label, count }));
    return filtered;
  }

  // New method to get data for fixed Amenities chart (WiFi, AC, TV, Charging Ports, Quiet Zone)
  getFixedAmenitiesData() {
    const fixedAmenities = ['WiFi', 'AC', 'TV', 'Charging Ports', 'Quiet Zone'];
    const amenitiesCounts = this.loungeService.getAmenitiesCounts();
    const filtered = fixedAmenities.map(label => ({
      label,
      count: amenitiesCounts[label] || 0
    }));
    return filtered;
  }

  // New method to get data for Amenities & Services coverage chart
  // Removed duplicate getAmenitiesServicesData method to fix duplicate function implementation error

  navigateTo(page: string): void { this.router.navigate([`/${page}`]); }

  goDashboard(): void {
    this.currentPage = 'dashboard';
    this.router.navigate(['/dashboard']);
  }

  onSearchChange(): void {
    const q = this.searchTerm.toLowerCase();
    this.filteredLounges = !q ? this.lounges : this.lounges.filter(l =>
      l.owner.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      l.address.toLowerCase().includes(q) ||
      l.phone.includes(q)
    );
  }

  clearSearch(): void { this.searchTerm = ''; this.filteredLounges = this.lounges; }

  addLounge(): void {
    this.router.navigate(['/add-lounge']);
  }

  view(l: Lounge): void {
    this.router.navigate(['/lounges-management/view', l.lounge_id]);
  }

  update(l: Lounge): void {
    this.router.navigate(['/lounges-management/edit', l.lounge_id]);
  }

  delete(l: Lounge): void {
    const ok = confirm(`Delete ${l.name}?`);
    if (ok) this.loungeService.delete(l.lounge_id);
  }

  refreshCharts(): void {
    const aCounts = this.loungeService.getAmenitiesCounts();
    const sCounts = this.loungeService.getServicesCounts();
    this.amenitiesCounts = Object.entries(aCounts).map(([label, count]) => ({ label, count }));
    this.servicesCounts = Object.entries(sCounts).map(([label, count]) => ({ label, count }));
  }

  getAmenitiesServicesData() {
    return {
      amenities: this.amenitiesCounts,
      services: this.servicesCounts
    };
  }

  totalLounges(): number { return this.lounges.length; }

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
    this.filteredLounges = [...this.filteredLounges].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'capacity':
          aValue = a.capacity;
          bValue = b.capacity;
          break;
        case 'price_per_hour':
          aValue = a.price_per_hour;
          bValue = b.price_per_hour;
          break;
        case 'operating_hours':
          aValue = a.operating_hours.toLowerCase();
          bValue = b.operating_hours.toLowerCase();
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


