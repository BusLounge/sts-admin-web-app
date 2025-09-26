import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() sidebarOpen = true;
  @Input() currentPage: string = 'dashboard';
  @Output() toggle = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  staffMenuExpanded = true;

  toggleStaffMenu(): void {
    this.staffMenuExpanded = !this.staffMenuExpanded;
  }

  setActivePage(page: string): void {
    this.currentPage = page;
    if (page === 'driver-management' || page === 'conductor-management') {
      this.staffMenuExpanded = true;
    }
  }
}


