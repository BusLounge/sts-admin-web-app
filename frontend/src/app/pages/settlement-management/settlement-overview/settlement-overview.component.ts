import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SettlementService } from '../../../core/services/settlement.service';
import { SettlementOverview, SpecialRequestItem, BatchDetail, ProcessNowResult, PricingConfig } from '../../../core/models/settlement.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../../shared/components/notification-panel/notification-panel.component';
import { NotificationService } from '../../../core/services/notification.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-settlement-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, NotificationPanelComponent, BaseChartDirective],
  templateUrl: './settlement-overview.component.html',
  styleUrls: ['./settlement-overview.component.scss']
})
export class SettlementOverviewComponent implements OnInit {
  overview: SettlementOverview | null = null;
  walletData: any = null;
  activeTab: 'overview' | 'wallet' | 'pricing' = 'overview';
  showNotificationPanel = false;
  showProfileMenu = false;
  isProcessing = false;

  // Feedback Notification Banner
  feedbackAlert: { type: 'success' | 'error' | 'info'; title: string; message: string; details?: string[] } | null = null;

  // Pricing & Revenue Split Configuration
  pricingConfig: PricingConfig = {
    default_ticket_price: 1000,
    bus_owner_share_pct: 70,
    driver_share_pct: 15,
    conductor_share_pct: 10,
    company_commission_pct: 5,
    default_lounge_fee: 1500,
    lounge_owner_share_pct: 95,
    lounge_commission_pct: 5
  };
  isLoadingPricing = false;
  isSavingPricing = false;
  simulationSeats = 40;

  // Special Requests Modal State
  showSpecialRequestsModal = false;
  specialRequests: SpecialRequestItem[] = [];
  isLoadingRequests = false;
  requestActionLoading: string | null = null;

  // Batch Details Modal State
  showBatchDetailsModal = false;
  selectedBatch: BatchDetail | null = null;
  isLoadingBatch = false;

  // Top Up & Reserve Modal State
  showTopUpModal = false;
  topUpAmount = 50000;
  topUpDescription = 'Treasury Working Capital Deposit';
  isSubmittingTopUp = false;

  showReserveModal = false;
  reserveAmount = 10000;
  isSubmittingReserve = false;

  // Chart configuration
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Company Income (LKR)',
        fill: true,
        tension: 0.4,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        pointBackgroundColor: '#4f46e5'
      }
    ]
  };
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  constructor(
    private settlementService: SettlementService,
    public notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AdminAuthService
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
    this.authService.performLogout();
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
        
        // Update Chart Data
        if (data.income_history && data.income_history.length > 0) {
          const labels = data.income_history.map((item: any) => item.date);
          const income = data.income_history.map((item: any) => item.income);
          
          this.lineChartData = {
            labels: labels,
            datasets: [
              {
                ...this.lineChartData.datasets[0],
                data: income
              }
            ]
          };
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading wallet', err);
      }
    });
  }

  switchTab(tab: 'overview' | 'wallet' | 'pricing') {
    this.activeTab = tab;
    if (tab === 'overview' && !this.overview) {
      this.loadOverview();
    } else if (tab === 'wallet' && !this.walletData) {
      this.loadWallet();
    } else if (tab === 'pricing') {
      this.loadPricingConfig();
    }
  }

  processNow() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.feedbackAlert = null;
    this.cdr.detectChanges();
    
    this.settlementService.processNow().subscribe({
      next: (res: ProcessNowResult) => {
        this.isProcessing = false;
        
        this.feedbackAlert = {
          type: res.batches_created > 0 ? 'success' : 'info',
          title: res.batches_created > 0 ? 'Payout Execution Succeeded!' : 'Midnight Sync Finished',
          message: res.message,
          details: res.details
        };

        this.loadOverview(); // Refresh overview numbers
        this.loadWallet();   // Refresh wallet & ledger
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isProcessing = false;
        this.feedbackAlert = {
          type: 'error',
          title: 'Settlement Process Error',
          message: err?.error?.error || 'Failed to trigger process. Please check server logs.'
        };
        this.cdr.detectChanges();
        console.error('Error triggering process', err);
      }
    });
  }

  dismissFeedback() {
    this.feedbackAlert = null;
  }

  // --- SPECIAL REQUESTS MODAL ---
  openSpecialRequestsModal() {
    this.showSpecialRequestsModal = true;
    this.isLoadingRequests = true;
    this.cdr.detectChanges();

    this.settlementService.getSpecialRequests().subscribe({
      next: (data) => {
        this.specialRequests = data;
        this.isLoadingRequests = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching special requests', err);
        this.isLoadingRequests = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeSpecialRequestsModal() {
    this.showSpecialRequestsModal = false;
  }

  approveRequest(req: SpecialRequestItem) {
    this.requestActionLoading = req.tracker_id;
    this.settlementService.actionSpecialRequest(req.tracker_id, 'approve').subscribe({
      next: () => {
        this.requestActionLoading = null;
        this.specialRequests = this.specialRequests.filter(r => r.tracker_id !== req.tracker_id);
        if (this.overview) {
          this.overview.special_requests_count = Math.max(0, this.overview.special_requests_count - 1);
        }
        this.feedbackAlert = {
          type: 'success',
          title: 'Request Approved',
          message: `7-day payout cycle approved for ${req.payee_name} (${req.payee_type}). Their payout will now trigger every 7 days.`
        };
        this.loadOverview();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.requestActionLoading = null;
        console.error('Error approving request', err);
        alert('Failed to approve request: ' + (err?.error?.error || 'Unknown error'));
        this.cdr.detectChanges();
      }
    });
  }

  rejectRequest(req: SpecialRequestItem) {
    this.requestActionLoading = req.tracker_id;
    this.settlementService.actionSpecialRequest(req.tracker_id, 'reject').subscribe({
      next: () => {
        this.requestActionLoading = null;
        this.specialRequests = this.specialRequests.filter(r => r.tracker_id !== req.tracker_id);
        if (this.overview) {
          this.overview.special_requests_count = Math.max(0, this.overview.special_requests_count - 1);
        }
        this.feedbackAlert = {
          type: 'info',
          title: 'Request Declined',
          message: `7-day cycle request for ${req.payee_name} was declined. The payee remains on their default 14-day cycle.`
        };
        this.loadOverview();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.requestActionLoading = null;
        console.error('Error rejecting request', err);
        alert('Failed to reject request: ' + (err?.error?.error || 'Unknown error'));
        this.cdr.detectChanges();
      }
    });
  }

  // --- BATCH DETAILS MODAL ---
  openBatchDetails(batchId: string) {
    this.showBatchDetailsModal = true;
    this.isLoadingBatch = true;
    this.selectedBatch = null;
    this.cdr.detectChanges();

    this.settlementService.getBatchDetails(batchId).subscribe({
      next: (batch) => {
        this.selectedBatch = batch;
        this.isLoadingBatch = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching batch details', err);
        this.isLoadingBatch = false;
        alert('Failed to load batch details');
        this.cdr.detectChanges();
      }
    });
  }

  closeBatchDetails() {
    this.showBatchDetailsModal = false;
    this.selectedBatch = null;
  }

  // --- COMPANY WALLET TOP-UP & RESERVE ---
  openTopUpModal() {
    this.topUpAmount = 50000;
    this.topUpDescription = 'Treasury Working Capital Deposit';
    this.showTopUpModal = true;
  }

  closeTopUpModal() {
    this.showTopUpModal = false;
  }

  submitTopUp() {
    if (!this.topUpAmount || this.topUpAmount <= 0) {
      alert('Please enter a valid top-up amount');
      return;
    }

    this.isSubmittingTopUp = true;
    this.settlementService.topUpWallet(this.topUpAmount, this.topUpDescription).subscribe({
      next: () => {
        this.isSubmittingTopUp = false;
        this.showTopUpModal = false;
        this.feedbackAlert = {
          type: 'success',
          title: 'Deposit Successful',
          message: `LKR ${this.topUpAmount.toLocaleString()} credited to Company Wallet balance.`
        };
        this.loadWallet();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmittingTopUp = false;
        console.error('Error topping up wallet', err);
        alert('Top-up failed: ' + (err?.error?.error || 'Unknown error'));
        this.cdr.detectChanges();
      }
    });
  }

  openReserveModal() {
    this.reserveAmount = this.walletData?.reserve_threshold || 10000;
    this.showReserveModal = true;
  }

  closeReserveModal() {
    this.showReserveModal = false;
  }

  submitReserve() {
    if (this.reserveAmount < 0) {
      alert('Reserve threshold cannot be negative');
      return;
    }

    this.isSubmittingReserve = true;
    this.settlementService.updateReserve(this.reserveAmount).subscribe({
      next: () => {
        this.isSubmittingReserve = false;
        this.showReserveModal = false;
        this.feedbackAlert = {
          type: 'success',
          title: 'Reserve Threshold Updated',
          message: `Company wallet reserve threshold set to LKR ${this.reserveAmount.toLocaleString()}.`
        };
        this.loadWallet();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmittingReserve = false;
        console.error('Error updating reserve', err);
        alert('Failed to update reserve: ' + (err?.error?.error || 'Unknown error'));
        this.cdr.detectChanges();
      }
    });
  }

  // --- PRICING & REVENUE SPLIT CONFIGURATION ---
  loadPricingConfig() {
    this.isLoadingPricing = true;
    this.settlementService.getPricingConfig().subscribe({
      next: (cfg) => {
        this.pricingConfig = cfg;
        this.isLoadingPricing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading pricing config', err);
        this.isLoadingPricing = false;
        this.cdr.detectChanges();
      }
    });
  }

  onBusShareChange(changed: 'owner' | 'driver' | 'conductor' | 'commission') {
    if (changed !== 'commission') {
      const remaining = 100 - (
        (this.pricingConfig.bus_owner_share_pct || 0) +
        (this.pricingConfig.driver_share_pct || 0) +
        (this.pricingConfig.conductor_share_pct || 0)
      );
      this.pricingConfig.company_commission_pct = Math.max(0, parseFloat(remaining.toFixed(2)));
    }
    this.cdr.detectChanges();
  }

  onLoungeShareChange(changed: 'owner' | 'commission') {
    if (changed === 'owner') {
      const remaining = 100 - (this.pricingConfig.lounge_owner_share_pct || 0);
      this.pricingConfig.lounge_commission_pct = Math.max(0, parseFloat(remaining.toFixed(2)));
    }
    this.cdr.detectChanges();
  }

  get busSplitTotal(): number {
    return parseFloat((
      (this.pricingConfig.bus_owner_share_pct || 0) +
      (this.pricingConfig.driver_share_pct || 0) +
      (this.pricingConfig.conductor_share_pct || 0) +
      (this.pricingConfig.company_commission_pct || 0)
    ).toFixed(2));
  }

  get isBusSplitValid(): boolean {
    return Math.abs(this.busSplitTotal - 100) < 0.05;
  }

  get loungeSplitTotal(): number {
    return parseFloat((
      (this.pricingConfig.lounge_owner_share_pct || 0) +
      (this.pricingConfig.lounge_commission_pct || 0)
    ).toFixed(2));
  }

  get isLoungeSplitValid(): boolean {
    return Math.abs(this.loungeSplitTotal - 100) < 0.05;
  }

  get canSavePricing(): boolean {
    return this.isBusSplitValid &&
           this.isLoungeSplitValid &&
           this.pricingConfig.default_ticket_price > 0 &&
           this.pricingConfig.default_lounge_fee > 0 &&
           !this.isSavingPricing;
  }

  // Calculated per-seat amounts
  get busOwnerSeatAmount(): number {
    return ((this.pricingConfig.default_ticket_price || 0) * (this.pricingConfig.bus_owner_share_pct || 0)) / 100;
  }
  get driverSeatAmount(): number {
    return ((this.pricingConfig.default_ticket_price || 0) * (this.pricingConfig.driver_share_pct || 0)) / 100;
  }
  get conductorSeatAmount(): number {
    return ((this.pricingConfig.default_ticket_price || 0) * (this.pricingConfig.conductor_share_pct || 0)) / 100;
  }
  get companyCommissionSeatAmount(): number {
    return ((this.pricingConfig.default_ticket_price || 0) * (this.pricingConfig.company_commission_pct || 0)) / 100;
  }

  // Calculated full trip amounts
  get tripTotalRevenue(): number {
    return (this.pricingConfig.default_ticket_price || 0) * this.simulationSeats;
  }
  get tripBusOwnerRevenue(): number {
    return (this.tripTotalRevenue * (this.pricingConfig.bus_owner_share_pct || 0)) / 100;
  }
  get tripDriverRevenue(): number {
    return (this.tripTotalRevenue * (this.pricingConfig.driver_share_pct || 0)) / 100;
  }
  get tripConductorRevenue(): number {
    return (this.tripTotalRevenue * (this.pricingConfig.conductor_share_pct || 0)) / 100;
  }
  get tripCompanyRevenue(): number {
    return (this.tripTotalRevenue * (this.pricingConfig.company_commission_pct || 0)) / 100;
  }

  // Calculated lounge per-guest amounts
  get loungeOwnerAmount(): number {
    return ((this.pricingConfig.default_lounge_fee || 0) * (this.pricingConfig.lounge_owner_share_pct || 0)) / 100;
  }
  get loungeCompanyAmount(): number {
    return ((this.pricingConfig.default_lounge_fee || 0) * (this.pricingConfig.lounge_commission_pct || 0)) / 100;
  }

  savePricingConfig() {
    if (!this.canSavePricing) return;
    this.isSavingPricing = true;
    this.settlementService.updatePricingConfig(this.pricingConfig).subscribe({
      next: () => {
        this.isSavingPricing = false;
        this.feedbackAlert = {
          type: 'success',
          title: 'Pricing & Split Configuration Saved!',
          message: 'The new ticket price and revenue split percentages have been updated in the database. Customer booking fares and all future settlements will use these updated values.'
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingPricing = false;
        console.error('Error saving pricing config', err);
        const errorMsg = err?.error?.error || err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || err?.message || 'Unknown error';
        this.feedbackAlert = {
          type: 'error',
          title: 'Failed to Save Configuration',
          message: errorMsg
        };
        alert('Failed to save configuration: ' + errorMsg);
        this.cdr.detectChanges();
      }
    });
  }

  resetPricingToDefaults() {
    if (confirm('Reset pricing and split percentages to default settings (LKR 1,000 Ticket / 70% Owner / 15% Driver / 10% Conductor / 5% Company)?')) {
      this.pricingConfig = {
        default_ticket_price: 1000,
        bus_owner_share_pct: 70,
        driver_share_pct: 15,
        conductor_share_pct: 10,
        company_commission_pct: 5,
        default_lounge_fee: 1500,
        lounge_owner_share_pct: 95,
        lounge_commission_pct: 5
      };
      this.savePricingConfig();
    }
  }
}


