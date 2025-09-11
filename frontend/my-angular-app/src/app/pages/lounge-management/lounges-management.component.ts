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

  // New method to get fixed amenities data
  getFixedAmenitiesData() {
    return [
      { label: 'WiFi', count: 3 },
      { label: 'AC', count: 2 },
      { label: 'TV', count: 1 },
      { label: 'Charging Ports', count: 1 },
      { label: 'Quiet Zone', count: 1 }
    ];
  }

  // New method to get data for Amenities & Services coverage chart
  getAmenitiesServicesData() {
    const amenitiesCounts = this.loungeService.getAmenitiesCounts();
    const servicesCounts = this.loungeService.getServicesCounts();
    return {
      amenities: Object.entries(amenitiesCounts).map(([label, count]) => ({ label, count })),
      services: Object.entries(servicesCounts).map(([label, count]) => ({ label, count }))
    };
  }

  navigateTo(page: string): void { this.router.navigate([`/${page}`]); }

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
    this.router.navigate(['/lounges-management/add']);
  }

  view(l: Lounge): void {
    alert(`Lounge: ${l.name}\nOwner: ${l.owner}\nPhone: ${l.phone}`);
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

  totalLounges(): number { return this.lounges.length; }
}


