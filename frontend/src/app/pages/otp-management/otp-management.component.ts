import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface OTPRecord {
  id: string;
  otp: string;
  phone: string;
  app_name: string;
  created_at: string;
}

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-otp-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './otp-management.component.html',
  styleUrls: ['./otp-management.component.scss']
})
export class OtpManagementComponent implements OnInit, OnDestroy {
  otpData: OTPRecord[] = [];
  filteredData: OTPRecord[] = [];
  loading = true;
  error: string | null = null;
  copiedId: string | null = null;
  
  filter = '';
  selectedApp = 'all';
  dropdownOpen = false;

  showNotificationPanel = false;
  showProfileMenu = false;

  private pollSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchOTPData();
      // Poll every 3 seconds
      this.pollSubscription = interval(3000).subscribe(() => {
        this.fetchOTPData(false);
      });
      document.addEventListener('click', this.handleOutsideClick.bind(this));
    }
  }

  ngOnDestroy() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }
  }

  handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.app-filter-dropdown-container')) {
      this.dropdownOpen = false;
    }
  }

  fetchOTPData(showLoading = true) {
    if (showLoading && this.otpData.length === 0) {
      this.loading = true;
    }
    
    this.http.get<OTPRecord[]>(`${environment.apiUrl}/otp-master`).subscribe({
      next: (data) => {
        this.otpData = data || [];
        this.applyFilters();
        this.loading = false;
        this.error = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error fetching OTP data';
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectApp(app: string) {
    this.selectedApp = app;
    this.dropdownOpen = false;
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredData = this.otpData.filter((item) => {
      if (this.selectedApp !== 'all') {
        if (item.app_name?.toLowerCase() !== this.selectedApp.toLowerCase()) {
          return false;
        }
      }

      if (!this.filter) return true;
      const lowerFilter = this.filter.toLowerCase();
      return (
        item.app_name?.toLowerCase().includes(lowerFilter) ||
        item.phone?.includes(lowerFilter) ||
        item.otp?.toString().includes(lowerFilter)
      );
    });
  }

  copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    this.copiedId = id;
    setTimeout(() => (this.copiedId = null), 2000);
  }

  formatDate(timestamp: string) {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
    // Add logic if needed or redirect
  }
}
