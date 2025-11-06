import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import { Lounge } from '../../core/models/lounge.model';
import { LoungeService } from '../../core/services/lounge.service';

@Component({
  selector: 'app-lounges-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, BaseChartDirective, NotificationPanelComponent],
  templateUrl: './lounges-management.component.html',
  styleUrls: ['./lounges-management.component.scss']
})
export class LoungesManagementComponent implements OnInit {
  lounges: Lounge[] = [];
  filteredLounges: Lounge[] = [];
  searchTerm = '';
  priceFilter: number | null = null;
  showNotificationPanel = false;

  amenitiesCounts: { label: string; count: number }[] = [];
  servicesCounts: { label: string; count: number }[] = [];

  sidebarOpen = true;
  currentPage = 'lounges';

  // Sorting properties
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal properties
  showModal: boolean = false;
  modalMode: 'add' | 'view' | 'edit' = 'add';
  selectedLounge: Lounge | null = null;
  lounge: Lounge = {
    lounge_id: '0',
    owner: '',
    name: '',
    address: '',
    phone: '',
    capacity: 0,
    price_per_hour: 0,
    operating_hours: '',
    amenities: [],
    services: [],
    images: [],
    created_at: new Date().toISOString()
  };

  selectedAmenities: string[] = [];
  selectedServices: string[] = [];

  availableAmenities: string[] = ['WiFi', 'AC', 'TV', 'Charging Ports', 'Quiet Zone'];
  availableServices: string[] = ['Food', 'Drinks', 'Shower'];

  imagePreviews: string[] = [];
  private selectedFiles: File[] = [];

  // Chart properties
  barChartData: any[] = [];
  barChartOptions: any;
  isBrowser: boolean;

  exportLoungeHistoryPdf(): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Lounges History', 14, 16);

    const tableHead = [['Lounge Name', 'Owner', 'Address', 'Phone', 'Capacity', 'Price/hr', 'Operating Hours']];
    const tableBody = this.filteredLounges?.map((l: Lounge) => [
      l.name,
      l.owner,
      l.address,
      l.phone,
      String(l.capacity),
      `$${l.price_per_hour}`,
      l.operating_hours
    ]) ?? [];

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 22,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('lounges-history.pdf');
  }

  constructor(private router: Router, private loungeService: LoungeService, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.currentPage = 'lounges-management'; // Set currentPage to match sidebar item key
    if (this.isBrowser) {
      Chart.register(...registerables);
    }
    this.loungeService.lounges$.subscribe(ls => {
      this.lounges = ls;
      this.filteredLounges = ls;
      this.refreshCharts();
      if (this.isBrowser) {
        this.updateBarCharts();
      }
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
    this.filteredLounges = this.lounges.filter(l => {
      const matchesSearch = !q || 
        l.owner.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.phone.includes(q);
      const matchesPrice = this.priceFilter === null || l.price_per_hour === this.priceFilter;
      return matchesSearch && matchesPrice;
    });
  }

  clearSearch(): void { this.searchTerm = ''; this.priceFilter = null; this.filteredLounges = this.lounges; }

  addLounge(): void {
    this.modalMode = 'add';
    this.resetAddLoungeForm();
    this.showModal = true;
  }

  private resetAddLoungeForm(): void {
    this.lounge = {
      lounge_id: '0',
      owner: '',
      name: '',
      address: '',
      phone: '',
      capacity: 0,
      price_per_hour: 0,
      operating_hours: '',
      amenities: [],
      services: [],
      images: [],
      created_at: new Date().toISOString()
    };
    this.selectedAmenities = [];
    this.selectedServices = [];
    this.imagePreviews = [];
    this.selectedFiles = [];
  }

  saveAddLounge(): void {
    if (this.modalMode === 'add') {
      this.lounge.amenities = this.selectedAmenities;
      this.lounge.services = this.selectedServices;
      this.lounge.images = this.imagePreviews;
      this.loungeService.add(this.lounge);
    } else if (this.modalMode === 'edit') {
      this.lounge.amenities = this.selectedAmenities;
      this.lounge.services = this.selectedServices;
      this.lounge.images = this.imagePreviews;
      this.loungeService.update(this.lounge);
    }
    this.showModal = false;
  }

  cancelAddLounge(): void {
    this.showModal = false;
  }

  toggleAmenity(amenity: string): void {
    const index = this.selectedAmenities.indexOf(amenity);
    if (index > -1) {
      this.selectedAmenities.splice(index, 1);
    } else {
      this.selectedAmenities.push(amenity);
    }
  }

  toggleService(service: string): void {
    const index = this.selectedServices.indexOf(service);
    if (index > -1) {
      this.selectedServices.splice(index, 1);
    } else {
      this.selectedServices.push(service);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

  

    // Append to existing selections to allow multiple picks across interactions
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue; // skip non-images
      this.selectedFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = (e.target as FileReader).result as string;
        this.imagePreviews.push(result);
      };
      reader.readAsDataURL(file); // create base64 preview
    }

    // Clear the input to allow re-selecting the same files if needed
    input.value = '';
  }
  
  toggleNotificationPanel() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel() {
    this.showNotificationPanel = false;
  }
  view(l: Lounge): void {
    this.modalMode = 'view';
    this.lounge = { ...l };
    this.selectedAmenities = [...l.amenities];
    this.selectedServices = [...l.services];
    this.imagePreviews = [...l.images];
    this.showModal = true;
  }

  update(l: Lounge): void {
    this.modalMode = 'edit';
    this.lounge = { ...l };
    this.selectedAmenities = [...l.amenities];
    this.selectedServices = [...l.services];
    this.imagePreviews = [...l.images];
    this.showModal = true;
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

  updateBarCharts(): void {
    this.barChartData = [
      {
        labels: this.getCapacityPriceData().map(d => d.name),
        datasets: [{
          data: this.getCapacityPriceData().map(d => d.capacity),
          backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
          borderColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
          borderWidth: 0.25
        }]
      },
      {
        labels: this.getFoodDrinksShowerData().map(d => d.label),
        datasets: [{
          data: this.getFoodDrinksShowerData().map(d => d.count),
          backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533'],
          borderColor: ['#0046FF', '#a3a3a3', '#FAA533'],
          borderWidth: 0.25
        }]
      },
      {
        labels: this.getFixedAmenitiesData().map(d => d.label),
        datasets: [{
          data: this.getFixedAmenitiesData().map(d => d.count),
          backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533', '#6db9f8ff', '#fad577'],
          borderColor: ['#0046FF', '#a3a3a3', '#FAA533', '#6db9f8ff', '#fad577'],
          borderWidth: 0.25
        }]
      }
    ];
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

  getAmenitiesServicesData() {
    return {
      amenities: this.amenitiesCounts,
      services: this.servicesCounts
    };
  }

  totalLounges(): number { return this.lounges.length; }
goUserProfile() {
  this.router.navigate(['/user-profile']);
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


