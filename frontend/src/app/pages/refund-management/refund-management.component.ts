import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { NotificationService } from '../../core/services/notification.service';
import { RefundService } from '../../core/services/refund.service';
import { RefundItem, RefundDetail, RefundStats, RefundStatus } from '../../core/models/refund.model';

@Component({
  selector: 'app-refund-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, NotificationPanelComponent],
  templateUrl: './refund-management.component.html',
  styleUrls: ['./refund-management.component.scss']
})
export class RefundManagementComponent implements OnInit {
  refunds: RefundItem[] = [];
  filteredRefunds: RefundItem[] = [];
  selectedRefund: RefundDetail | null = null;
  stats: RefundStats = {
    pending_count: 0,
    completed_count: 0,
    failed_count: 0,
    total_refunded: 0,
    total_system_fees: 0
  };

  currentTab: 'pending' | 'completed' | 'failed' | 'all' = 'pending';
  searchTerm: string = '';
  isLoading: boolean = false;
  isDetailLoading: boolean = false;
  isActionLoading: boolean = false;
  showDrawer: boolean = false;

  // Action form fields
  customSystemCost: number = 0;
  customRefundAmount: number = 0;
  adminNotes: string = '';
  overrideConfirmed: boolean = false;
  rejectReason: string = '';
  showRejectModal: boolean = false;

  // Feedback messages
  successMsg: string = '';
  errorMsg: string = '';

  // Header states
  showNotificationPanel: boolean = false;
  showProfileMenu: boolean = false;

  constructor(
    private refundService: RefundService,
    public notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
    this.cdr.detectChanges();
  }

  toggleNotificationPanel(): void {
    this.showNotificationPanel = !this.showNotificationPanel;
    this.cdr.detectChanges();
  }

  closeNotificationPanel(): void {
    this.showNotificationPanel = false;
    this.cdr.detectChanges();
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_user');
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadRefunds();
  }

  loadStats(): void {
    this.refundService.getRefundStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading refund stats:', err)
    });
  }

  loadRefunds(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.refundService.getRefunds(this.currentTab).subscribe({
      next: (res) => {
        this.refunds = res.data || [];
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showError('Failed to load refunds: ' + (err.error?.error || err.message));
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: 'pending' | 'completed' | 'failed' | 'all'): void {
    this.currentTab = tab;
    this.loadRefunds();
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase().trim();
    if (!q) {
      this.filteredRefunds = [...this.refunds];
    } else {
      this.filteredRefunds = this.refunds.filter(r =>
        (r.refund_reference && r.refund_reference.toLowerCase().includes(q)) ||
        (r.passenger_name && r.passenger_name.toLowerCase().includes(q)) ||
        (r.passenger_phone && r.passenger_phone.toLowerCase().includes(q)) ||
        (r.booking_reference && r.booking_reference.toLowerCase().includes(q)) ||
        (r.route_name && r.route_name.toLowerCase().includes(q)) ||
        (r.bus_number && r.bus_number.toLowerCase().includes(q))
      );
    }
    this.cdr.detectChanges();
  }

  openReviewDrawer(item: RefundItem): void {
    this.isDetailLoading = true;
    this.showDrawer = true;
    this.selectedRefund = null;
    this.adminNotes = '';
    this.overrideConfirmed = false;
    this.cdr.detectChanges();

    this.refundService.getRefundById(item.id).subscribe({
      next: (detail) => {
        this.selectedRefund = detail;
        this.customSystemCost = detail.criteria?.suggested_fee_amt ?? 0;
        this.customRefundAmount = detail.criteria?.suggested_refund_amt ?? 0;
        this.isDetailLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showError('Failed to fetch refund details: ' + (err.error?.error || err.message));
        this.isDetailLoading = false;
        this.showDrawer = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeDrawer(): void {
    this.showDrawer = false;
    this.selectedRefund = null;
    this.cdr.detectChanges();
  }

  onSystemCostChange(): void {
    if (!this.selectedRefund) return;
    const base = (this.selectedRefund.total_fare && this.selectedRefund.total_fare > 0)
      ? this.selectedRefund.total_fare
      : this.selectedRefund.requested_amount;
    let cost = Number(this.customSystemCost) || 0;
    if (cost < 0) cost = 0;
    if (cost > base) cost = base;
    this.customSystemCost = cost;
    this.customRefundAmount = Math.max(0, base - cost);
    this.cdr.detectChanges();
  }

  approveRefund(): void {
    if (!this.selectedRefund) return;

    if (this.selectedRefund.criteria.is_non_refundable) {
      this.showError('This request is strictly non-refundable as it has passed the 3-day post-trip window.');
      return;
    }

    if (this.selectedRefund.criteria.requires_override && !this.overrideConfirmed) {
      this.showError('Please check the discretionary override confirmation to approve post-trip refund.');
      return;
    }

    this.isActionLoading = true;
    this.cdr.detectChanges();

    const payload = {
      tier_applied: this.selectedRefund.criteria.suggested_tier,
      system_cost: Number(this.customSystemCost),
      admin_notes: this.adminNotes,
      override: this.overrideConfirmed
    };

    this.refundService.approveRefund(this.selectedRefund.id, payload).subscribe({
      next: (res) => {
        this.showSuccess(res.message || 'Refund successfully approved and settlements updated.');
        this.isActionLoading = false;
        this.closeDrawer();
        this.loadStats();
        this.loadRefunds();
      },
      error: (err) => {
        this.showError('Failed to approve refund: ' + (err.error?.error || err.message));
        this.isActionLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openRejectModal(): void {
    this.rejectReason = '';
    this.showRejectModal = true;
    this.cdr.detectChanges();
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
    this.cdr.detectChanges();
  }

  confirmReject(): void {
    if (!this.selectedRefund) return;
    if (!this.rejectReason.trim()) {
      this.showError('Please provide a reason for rejecting the refund.');
      return;
    }

    this.isActionLoading = true;
    this.cdr.detectChanges();

    this.refundService.rejectRefund(this.selectedRefund.id, this.rejectReason.trim()).subscribe({
      next: (res) => {
        this.showSuccess('Refund request rejected successfully.');
        this.isActionLoading = false;
        this.closeRejectModal();
        this.closeDrawer();
        this.loadStats();
        this.loadRefunds();
      },
      error: (err) => {
        this.showError('Failed to reject refund: ' + (err.error?.error || err.message));
        this.isActionLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getDepartureBadgeClass(hours: number): string {
    if (hours > 24) return 'badge-tier-1';
    if (hours >= 0 && hours <= 24) return 'badge-tier-2';
    if (hours < 0 && hours >= -72) return 'badge-tier-3';
    return 'badge-tier-4';
  }

  getDepartureLabel(hours: number): string {
    if (hours > 24) return 'Tier 1: > 24h Advance (95% Refund / 5% Fee)';
    if (hours >= 0 && hours <= 24) return 'Tier 2: Within 24h (90% Refund / 10% Fee)';
    if (hours < 0 && hours >= -72) return 'Tier 3: Post-Trip 0-3d (0% Default / Override Required)';
    return 'Tier 4: Window Expired (> 3d Past Trip)';
  }

  formatHoursCountdown(hours: number): string {
    if (hours > 0) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return `Departs in ${h}h ${m}m`;
    } else {
      const absH = Math.abs(hours);
      const h = Math.floor(absH);
      const m = Math.round((absH - h) * 60);
      return `Departed ${h}h ${m}m ago`;
    }
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMsg = '';
      this.cdr.detectChanges();
    }, 4500);
  }

  private showError(msg: string): void {
    this.errorMsg = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.errorMsg = '';
      this.cdr.detectChanges();
    }, 5500);
  }
}
