import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { NotificationService } from '../../../core/services/notification.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  children?: { label: string; route: string; }[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationPanelComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'fas fa-th-large', route: '/dashboard' },
    { 
      label: 'Bus', 
      icon: 'fas fa-bus', 
      route: '/bus-management',
      children: [
        { label: 'Bus Owners', route: '/bus-owners' },
        { label: 'Route Permits', route: '/bus-management' },
        { label: 'Scheduled Trips', route: '/scheduled-trips' }
      ]
    },
    { label: 'Driver', icon: 'fas fa-user-tie', route: '/driver-management' },
    { label: 'Conductor', icon: 'fas fa-user-secret', route: '/conductor-management' },
    { label: 'Passenger', icon: 'fas fa-users', route: '/passenger-management' },
    { label: 'Lounge', icon: 'fas fa-couch', route: '/lounges-management' },
    { label: 'Bus Bookings', icon: 'fas fa-ticket-alt', route: '/bus-booking' },
    { label: 'Lounge Bookings', icon: 'fas fa-clipboard-list', route: '/lounge-booking' },
    { label: 'Inventory', icon: 'fas fa-boxes', route: '/inventory-management' },
    { label: 'Advertisements', icon: 'fas fa-ad', route: '/advertisement-management' },
    { label: 'Routes', icon: 'fas fa-map', route: '/route-management' },
    { label: 'OTP Master', icon: 'fas fa-key', route: '/otp-management' },
    { 
      label: 'Support', 
      icon: 'fas fa-headset', 
      route: '/support', 
      children: [
        { label: 'Complaints', route: '/complaints' },
        { label: 'Assigned Complaints', route: '/complaints/assigned' }
       
      ]
    },
    { label: 'Setting', icon: 'fas fa-cog', route: '/settings' }
  ];

  activeDropdown: string | null = null;
  showProfileMenu = false;
  showNotificationPanel = false;

  constructor(private router: Router, public notificationService: NotificationService) {}

  ngOnInit() {}

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  toggleNotificationPanel() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel() {
    this.showNotificationPanel = false;
  }

  logout() {
    // Add logout logic here
    this.router.navigate(['/login']);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  toggleDropdown(label: string) {
    if (this.activeDropdown === label) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = label;
    }
  }
}
