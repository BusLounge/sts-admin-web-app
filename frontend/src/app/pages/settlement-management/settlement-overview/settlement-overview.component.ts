import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  walletData: any = null;
  activeTab: 'overview' | 'wallet' = 'overview';
  showNotificationPanel = false;
  showProfileMenu = false;
  isProcessing = false;

  constructor(
    private settlementService: SettlementService,
    public notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading overview', error);
      }
    });
  }

  loadWallet() {
    this.settlementService.getWallet().subscribe({
      next: (data) => {
        this.walletData = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading wallet', err);
      }
    });
  }

  switchTab(tab: 'overview' | 'wallet') {
    this.activeTab = tab;
    if (tab === 'overview' && !this.overview) {
      this.loadOverview();
    } else if (tab === 'wallet' && !this.walletData) {
      this.loadWallet();
    }
  }

  processNow() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.cdr.detectChanges();
    
    this.settlementService.processNow().subscribe({
      next: (res) => {
        this.isProcessing = false;
        this.cdr.detectChanges();
        alert('Process triggered successfully! The background engine has finished syncing bookings and updating settlements.');
        this.loadOverview(); // Refresh the data
      },
      error: (err) => {
        this.isProcessing = false;
        this.cdr.detectChanges();
        console.error('Error triggering process', err);
        alert('Error triggering process. Please check the console logs.');
      }
    });
  }
}
