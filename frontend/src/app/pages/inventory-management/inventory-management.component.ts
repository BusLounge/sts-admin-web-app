import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryItem, InventoryCategory } from '../../core/models/inventory.model';
import { AddInventoryItemComponent } from './add-inventory-item.component';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, NotificationPanelComponent, RouterModule, AddInventoryItemComponent],
  templateUrl: './inventory-management.component.html',
  styleUrls: ['./inventory-management.component.scss']
})
export class InventoryManagementComponent implements OnInit {
  items: InventoryItem[] = [];
  filteredItems: InventoryItem[] = [];
  categories: InventoryCategory[] = [];
  
  searchTerm: string = '';
  searchCriteria: string = 'name'; // 'name' or 'item_code'
  categoryFilter: string = 'all';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  
  showNotificationPanel = false;
  showAddModal = false;

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inventoryService.items$.subscribe(items => {
      this.items = items;
      this.applyFilters();
      this.cdr.detectChanges();
    });
    
    this.inventoryService.categories$.subscribe(categories => {
      this.categories = categories;
      this.cdr.detectChanges();
    });
  }

  toggleNotificationPanel() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel() {
    this.showNotificationPanel = false;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = this.items;

    if (this.searchTerm.trim()) {
      const lower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const val = this.searchCriteria === 'item_code' ? item.item_code : item.name;
        return val?.toLowerCase().includes(lower);
      });
    }

    if (this.categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category_id === this.categoryFilter);
    }

    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(item => item.is_active === isActive);
    }

    this.filteredItems = filtered;
  }

  addItem() {
    this.showAddModal = true;
  }

  editItem(item: InventoryItem) {
    this.router.navigate(['/inventory-management/edit', item.id]);
  }

  toggleActive(item: InventoryItem) {
    if (!item.id) return;
    
    const action = item.is_active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${item.name}?`)) {
      return;
    }

    const newStatus = !item.is_active;
    this.inventoryService.toggleStatus(item.id, newStatus).subscribe({
      next: () => {
        // State updates automatically via loadItems() in service
      },
      error: (err) => {
        console.error('Error toggling status', err);
        alert('Failed to update status.');
      }
    });
  }
}
