import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SettlementService } from '../../../core/services/settlement.service';
import { SettlementOverview } from '../../../core/models/settlement.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../../shared/components/notification-panel/notification-panel.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-settlement-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, NotificationPanelComponent],
  templateUrl: './settlement-overview.component.html',
  styleUrls: ['./settlement-overview.component.scss']
})
export class SettlementOverviewComponent implements OnInit {
  overview: SettlementOverview | null = null;
  showNotificationPanel = false;
  showProfileMenu = false;

  constructor(
    private settlementService: SettlementService,
    public notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  toggleNotificationPanel() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel() {
    this.showNotificationPanel = false;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('adminRole');
    this.router.navigate(['/login']);
  }

  loadOverview() {
    this.settlementService.getOverview().subscribe({
      next: (data) => {
        this.overview = data;
      },
      error: (error) => {
        console.error('Error loading overview', error);
      }
    });
  }

  processNow() {
    this.settlementService.processNow().subscribe({
      next: (res) => {
        alert('Process triggered successfully!');
        this.loadOverview(); // Refresh the data
      },
      error: (err) => {
        console.error('Error triggering process', err);
        alert('Error triggering process');
      }
    });
  }
}
