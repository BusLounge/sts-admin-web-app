import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { NotificationService } from '../../core/services/notification.service';

interface BusOwner {
  id: number;
  company: string;
  email: string;
  contact: string;
  nic_number: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected';
  documents: string[];
}

@Component({
  selector: 'app-bus-owners',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, NotificationPanelComponent],
  templateUrl: './bus-owners.component.html',
  styleUrls: ['./bus-owners.component.scss']
})
export class BusOwnersComponent implements OnInit {
  busOwners: BusOwner[] = [];
  filteredBusOwners: BusOwner[] = [];
  searchTerm: string = '';
  showNotificationPanel = false;
  showProfileMenu = false;
  showAddOwnerModal = false;

  // Sorting properties
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // New bus owner form
  newOwner = {
    company: '',
    email: '',
    contact: '',
    nic_number: ''
  };

  constructor(
    private router: Router,
    public notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadBusOwners();
  }

  loadBusOwners(): void {
    // Mock data - replace with actual API call
    this.busOwners = [
      {
        id: 1,
        company: 'Swift Transport Ltd',
        email: 'contact@swifttransport.com',
        contact: '+94 77 123 4567',
        nic_number: '199012345678',
        verification_status: 'Verified',
        documents: ['license.pdf', 'incorporation.pdf']
      },
      {
        id: 2,
        company: 'Express Lines Pvt Ltd',
        email: 'info@expresslines.lk',
        contact: '+94 71 234 5678',
        nic_number: '198523456789',
        verification_status: 'Pending',
        documents: ['license.pdf']
      },
      {
        id: 3,
        company: 'City Bus Service',
        email: 'admin@citybus.lk',
        contact: '+94 76 345 6789',
        nic_number: '199234567890',
        verification_status: 'Verified',
        documents: ['license.pdf', 'incorporation.pdf', 'tax.pdf']
      },
      {
        id: 4,
        company: 'Metro Coach Company',
        email: 'support@metrocoach.com',
        contact: '+94 75 456 7890',
        nic_number: '198834567891',
        verification_status: 'Pending',
        documents: ['license.pdf']
      },
      {
        id: 5,
        company: 'Royal Transit Services',
        email: 'contact@royaltransit.lk',
        contact: '+94 77 567 8901',
        nic_number: '199545678902',
        verification_status: 'Rejected',
        documents: ['license.pdf', 'incorporation.pdf']
      }
    ];
    this.applyFilters();
  }

  getTotalBusOwners(): number {
    return this.busOwners.length;
  }

  getPendingVerifications(): number {
    return this.busOwners.filter(owner => owner.verification_status === 'Pending').length;
  }

  getVerifiedCount(): number {
    return this.busOwners.filter(owner => owner.verification_status === 'Verified').length;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredBusOwners = this.busOwners.filter(owner => {
      const searchLower = this.searchTerm.toLowerCase();
      return (
        owner.id.toString().includes(searchLower) ||
        owner.company.toLowerCase().includes(searchLower) ||
        owner.email.toLowerCase().includes(searchLower) ||
        owner.contact.toLowerCase().includes(searchLower) ||
        owner.nic_number.toLowerCase().includes(searchLower) ||
        owner.verification_status.toLowerCase().includes(searchLower)
      );
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredBusOwners.sort((a, b) => {
      let aValue: any = a[column as keyof BusOwner];
      let bValue: any = b[column as keyof BusOwner];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getVerificationBadgeClass(status: string): string {
    switch (status) {
      case 'Verified':
        return 'badge-verified';
      case 'Pending':
        return 'badge-pending';
      case 'Rejected':
        return 'badge-rejected';
      default:
        return '';
    }
  }

  addOwner(): void {
    this.showAddOwnerModal = true;
  }

  closeAddOwnerModal(): void {
    this.showAddOwnerModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newOwner = {
      company: '',
      email: '',
      contact: '',
      nic_number: ''
    };
  }

  saveOwner(): void {
    // Validate required fields
    if (!this.newOwner.company || !this.newOwner.email || !this.newOwner.contact || !this.newOwner.nic_number) {
      alert('Please fill all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newOwner.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Create new owner
    const newBusOwner: BusOwner = {
      id: this.busOwners.length > 0 ? Math.max(...this.busOwners.map(o => o.id)) + 1 : 1,
      company: this.newOwner.company,
      email: this.newOwner.email,
      contact: this.newOwner.contact,
      nic_number: this.newOwner.nic_number,
      verification_status: 'Pending',
      documents: []
    };

    this.busOwners.push(newBusOwner);
    this.applyFilters();
    alert('Bus owner added successfully!');
    this.closeAddOwnerModal();
  }

  viewDocuments(owner: BusOwner): void {
    console.log('View documents for:', owner);
    // Implement document viewing logic
  }

  editOwner(owner: BusOwner): void {
    console.log('Edit owner:', owner);
    // Implement edit logic or navigate to edit page
  }

  deleteOwner(owner: BusOwner): void {
    if (confirm(`Are you sure you want to delete ${owner.company}?`)) {
      const index = this.busOwners.findIndex(o => o.id === owner.id);
      if (index > -1) {
        this.busOwners.splice(index, 1);
        this.applyFilters();
      }
    }
  }

  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  toggleNotificationPanel(): void {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel(): void {
    this.showNotificationPanel = false;
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
