import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { AdvertisementService } from '../../core/services/advertisement.service';
import { LoungeService } from '../../core/services/lounge.service';
import { NotificationService } from '../../core/services/notification.service';
import { Advertisement, AdvertisementGroup, AdvertisementGroupCreateRequest } from '../../core/models/advertisement.model';

type TrafficLevel = 'Peak' | 'Moderate' | 'Off-Peak';

interface TrafficTimePeriod {
  name: string;
  startTime: string;
  endTime: string;
  trafficLevel: TrafficLevel;
  wrapsToNextDay?: boolean;
}

interface AdCycle {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  bookedSeconds: number;
  availableSeconds: number;
  isFull: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-advertisement-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, NotificationPanelComponent, RouterModule],
  templateUrl: './advertisement-management.component.html',
  styleUrls: ['./advertisement-management.component.scss']
})
export class AdvertisementManagementComponent implements OnInit, OnDestroy {

  // ── Tabs ─────────────────────────────────────────────────────────────────
  activeTab: 'advertisements' | 'groups' | 'slots' = 'advertisements';

  // ── Data ─────────────────────────────────────────────────────────────────
  advertisements: any[] = [];
  advertisementGroups: AdvertisementGroup[] = [];
  availableGroups: string[] = [];
  availableLounges: string[] = [];
  lounges: any[] = [];

  // ── Lounge slots state ───────────────────────────────────────────────────
  selectedLoungeId = '';
  loungeAdSlots: any = null;
  loungeAdSlotsLoadError = '';
  isLoadingSlots = false;

  // ── Search ────────────────────────────────────────────────────────────────
  searchTerm = '';
  groupSearchTerm = '';
  loungeSearchTerm = '';

  // ── Modal state ───────────────────────────────────────────────────────────
  showModal = false;
  showGroupModal = false;
  isViewMode = false;
  isEditMode = false;
  isViewGroupMode = false;
  isEditGroupMode = false;
  isSaving = false;

  // ── Advertisement form ────────────────────────────────────────────────────
  viewData: any = {
    addNo: '', name: '', category: '', duration: '',
    scheduleType: '', loungeGroups: '', priority: '',
    version: '', status: '', fileName: '', mediaUrl: '', description: '', selectedTimeSlots: []
  };
  selectedFile: File | null = null;
  selectedGroups: string[] = [];
  showGroupDropdown = false;
  isEmergencyCategory = false;
  isEnabled = true;

  // ── Schedule fields ───────────────────────────────────────────────────────
  scheduleType = 'recurring';
  occursType = 'daily';
  frequencyType = 'once';
  recurrenceInterval = 1;
  occursOnceTime = '12:00';
  startingTime = '12:00';
  endingTime = '23:59';
  startDate = '';
  endDate = '';
  noEndDate = false;
  oneTimeScheduleDate = '';
  oneTimeScheduleTime = '12:00';
  weeklyMonday = false; weeklyTuesday = false; weeklyWednesday = false;
  weeklyThursday = false; weeklyFriday = false; weeklySaturday = false; weeklySunday = false;
  monthlyDayOfMonth = 1;
  monthlyWeek = 'first';
  monthlyDay = 'Monday';
  monthlyType = 'dayOfMonth';
  occursEveryInterval = 1;
  occursEveryUnit = 'Hourly';
  maxIdleLoopDuration = 60;

  // ── Traffic / Slot helper ─────────────────────────────────────────────────
  selectedTrafficLevel: TrafficLevel | '' = '';
  selectedTimePeriodName = '';
  availableCycles: AdCycle[] = [];

  readonly trafficTimePeriods: TrafficTimePeriod[] = [
    { name: 'Early Morning', startTime: '04:30', endTime: '06:30', trafficLevel: 'Off-Peak' },
    { name: 'Morning',       startTime: '06:30', endTime: '09:30', trafficLevel: 'Peak' },
    { name: 'Late Morning',  startTime: '09:30', endTime: '12:00', trafficLevel: 'Moderate' },
    { name: 'Noon',          startTime: '12:00', endTime: '13:00', trafficLevel: 'Off-Peak' },
    { name: 'Afternoon',     startTime: '13:00', endTime: '16:30', trafficLevel: 'Moderate' },
    { name: 'Evening',       startTime: '16:30', endTime: '19:30', trafficLevel: 'Peak' },
    { name: 'Night',         startTime: '19:30', endTime: '21:30', trafficLevel: 'Moderate' },
    { name: 'Late Night',    startTime: '21:30', endTime: '04:30', trafficLevel: 'Off-Peak', wrapsToNextDay: true },
  ];

  private readonly trafficCycleSeconds: Record<TrafficLevel, { schedule: number; ad: number }> = {
    'Peak':     { schedule: 20, ad: 10 },
    'Moderate': { schedule: 15, ad: 15 },
    'Off-Peak': { schedule: 12, ad: 18 },
  };

  get maxAllowedAdDurationSeconds(): number {
    if (!this.selectedTrafficLevel) return 10;
    return this.trafficCycleSeconds[this.selectedTrafficLevel].ad;
  }

  get filteredTrafficTimePeriods(): TrafficTimePeriod[] {
    if (!this.selectedTrafficLevel) return this.trafficTimePeriods;
    return this.trafficTimePeriods.filter(p => p.trafficLevel === this.selectedTrafficLevel);
  }

  // ── Group form ────────────────────────────────────────────────────────────
  groupData = { id: '', groupName: '', lounges: [] as string[] };
  selectedLounges: string[] = [];
  showLoungeDropdown = false;

  // ── UI state ──────────────────────────────────────────────────────────────
  showNotificationPanel = false;
  showProfileMenu = false;
  private refreshInterval: any;

  constructor(
    private advertisementService: AdvertisementService,
    private loungeService: LoungeService,
    public notificationService: NotificationService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAdvertisements();
      this.loadGroups();
      this.loadLounges();
      this.initDefaultDates();

      this.refreshInterval = setInterval(() => {
        if (this.activeTab === 'advertisements') {
          this.loadAdvertisements();
        } else if (this.activeTab === 'groups') {
          this.loadGroups();
        } else if (this.activeTab === 'slots' && this.selectedLoungeId) {
          this.loadLoungeSlots(this.selectedLoungeId);
        }
      }, 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  loadAdvertisements(): void {
    this.advertisementService.getAllAdvertisements().subscribe({
      next: (ads) => {
        this.advertisements = ads.map((ad, i) => ({
          addNo: ad.id || `Ad-${String(i + 1).padStart(2, '0')}`,
          name: ad.advertisementName || 'Unnamed',
          category: ad.advertisementCategory || 'N/A',
          duration: ad.mediaDuration ? `${ad.mediaDuration}s` : '0s',
          scheduleType: ad.scheduleType || 'N/A',
          loungeGroups: ad.loungeGroupName || 'N/A',
          priority: this.capitalize(ad.priority || 'medium'),
          version: ad.version ? `v${ad.version}.0` : 'v1.0',
          status: this.capitalize(ad.status || 'active'),
          originalData: ad
        }));
      },
      error: (err) => {
        console.error('Error loading advertisements:', err);
        this.advertisements = [];
      }
    });
  }

  loadGroups(): void {
    this.advertisementService.getAllGroups().subscribe({
      next: (groups) => {
        this.advertisementGroups = groups;
        this.availableGroups = groups.map(g => g.groupName);
      },
      error: (err) => {
        console.error('Error loading groups:', err);
        this.advertisementGroups = [];
      }
    });
  }

  loadLounges(): void {
    this.loungeService.loadLounges().subscribe({
      next: () => {
        this.lounges = this.loungeService.lounges || [];
        this.availableLounges = this.lounges.map(l => l.lounge_name);
        if (this.lounges.length > 0 && !this.selectedLoungeId) {
          this.selectLounge(this.lounges[0].lounge_id);
        }
      },
      error: (err) => console.error('Error loading lounges:', err)
    });
  }

  selectLounge(loungeId: string): void {
    this.selectedLoungeId = loungeId;
    this.loadLoungeSlots(loungeId);
  }

  getLoungesDisplay(loungesStr: string | string[]): string {
    if (!loungesStr) return 'N/A';
    if (Array.isArray(loungesStr)) return loungesStr.join(', ');
    try {
      const parsed = JSON.parse(loungesStr);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch (e) {
      // Ignore, just return as is
    }
    return loungesStr;
  }

  loadLoungeSlots(loungeId: string): void {
    if (!loungeId) return;
    this.isLoadingSlots = true;
    this.loungeAdSlotsLoadError = '';
    this.advertisementService.getLoungeAdSlots(loungeId).subscribe({
      next: (slots) => {
        this.loungeAdSlots = slots;
        this.isLoadingSlots = false;
      },
      error: (err) => {
        console.error('Error loading slots:', err);
        this.loungeAdSlots = null;
        this.loungeAdSlotsLoadError = err?.error?.error || 'Failed to load slot summary';
        this.isLoadingSlots = false;
      }
    });
  }

  get cyclePreviewSegments(): any[] {
    const slots = this.loungeAdSlots;
    const scheduleSeconds = 6;
    const adWindow = 24;
    const companyBooked = Math.min(adWindow, Math.max(0, slots?.bookedSeconds || 0));
    const fallbackSeconds = Math.max(0, adWindow - companyBooked);

    return [
      {
        key: 'schedule',
        label: `Schedules ${scheduleSeconds}s`,
        seconds: scheduleSeconds,
        color: '#4f46e5'
      },
      {
        key: 'company',
        label: `Company Ads ${companyBooked}s`,
        seconds: companyBooked,
        color: '#f59e0b'
      },
      {
        key: 'fallback',
        label: `Available Ads ${fallbackSeconds}s`,
        seconds: fallbackSeconds,
        color: '#10b981'
      }
    ];
  }

  cycleSegmentWidth(seconds: number): number {
    return (seconds / 30) * 100;
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  switchTab(tab: 'advertisements' | 'groups' | 'slots'): void {
    this.activeTab = tab;
    this.searchTerm = '';
    if (tab === 'slots' && this.selectedLoungeId) {
      this.loadLoungeSlots(this.selectedLoungeId);
    }
  }

  // ── Filtered lists ────────────────────────────────────────────────────────
  get filteredAdvertisements(): any[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.advertisements;
    return this.advertisements.filter(ad =>
      ad.name.toLowerCase().includes(term) ||
      ad.category.toLowerCase().includes(term) ||
      ad.scheduleType.toLowerCase().includes(term) ||
      ad.loungeGroups.toLowerCase().includes(term) ||
      ad.priority.toLowerCase().includes(term) ||
      ad.status.toLowerCase().includes(term)
    );
  }

  get filteredAdvertisementGroups(): AdvertisementGroup[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.advertisementGroups;
    return this.advertisementGroups.filter(g =>
      g.groupName.toLowerCase().includes(term) ||
      this.getLoungesDisplay(g.lounges).toLowerCase().includes(term)
    );
  }

  get filteredSortedGroups(): string[] {
    const term = this.groupSearchTerm.trim().toLowerCase();
    return this.availableGroups
      .filter(g => !term || g.toLowerCase().includes(term))
      .sort((a, b) => {
        const aSelected = this.selectedGroups.includes(a);
        const bSelected = this.selectedGroups.includes(b);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return a.localeCompare(b);
      });
  }

  get filteredSortedLounges(): string[] {
    const term = this.loungeSearchTerm.trim().toLowerCase();
    return this.availableLounges
      .filter(l => !term || l.toLowerCase().includes(term))
      .sort((a, b) => {
        const aSelected = this.selectedLounges.includes(a);
        const bSelected = this.selectedLounges.includes(b);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return a.localeCompare(b);
      });
  }

  // ── Advertisement Modal ───────────────────────────────────────────────────
  openModal(): void {
    if (this.availableGroups.length === 0) this.loadGroups();
    this.isViewMode = false;
    this.isEditMode = false;
    this.isEmergencyCategory = false;
    this.showGroupDropdown = false;
    this.selectedGroups = [];
    this.groupSearchTerm = '';
    this.selectedFile = null;
    this.selectedTrafficLevel = '';
    this.selectedTimePeriodName = '';
    this.initDefaultDates();
    this.resetScheduleFields();
    this.viewData = {
      addNo: '', name: '', category: '', duration: '',
      scheduleType: '', loungeGroups: '', priority: '',
      version: '', status: '', fileName: '', mediaUrl: '', description: '', selectedTimeSlots: []
    };
    this.availableCycles = [];
    this.showModal = true;
  }

  viewAdvertisement(ad: any): void {
    this.isViewMode = true;
    this.isEditMode = false;
    this.showModal = true;
    this.populateForm(ad);
  }

  editAdvertisement(ad: any): void {
    this.isViewMode = false;
    this.isEditMode = true;
    this.showModal = true;
    this.populateForm(ad);
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedFile = null;
    this.showGroupDropdown = false;
  }

  populateForm(ad: any): void {
    if (!ad?.originalData) return;
    const data = ad.originalData;
    this.viewData = {
      addNo:       ad.addNo || data.id,
      name:        data.advertisementName || '',
      category:    this.capitalize(data.advertisementCategory || 'commercial'),
      duration:    data.mediaDuration ? `${data.mediaDuration}s` : '0s',
      scheduleType: this.capitalize(data.scheduleType || 'recurring'),
      loungeGroups: data.loungeGroupName || '',
      priority:    this.capitalize(data.priority || 'medium'),
      version:     data.version ? `v${data.version}.0` : 'v1.0',
      status:      this.capitalize(data.status || 'active'),
      fileName:    data.mediaUrl ? data.mediaUrl.split('/').pop() : '',
      mediaUrl:    data.mediaUrl || '',
      description: data.description || '',
      selectedTimeSlots: data.selectedTimeSlots ? data.selectedTimeSlots.split(',') : []
    };
    this.isEnabled = (data.status || '').toLowerCase() === 'active';
    this.isEmergencyCategory = data.advertisementCategory?.toLowerCase() === 'emergency';

    const st = data.scheduleType?.toLowerCase() || 'recurring';
    this.scheduleType = st === 'one-time' ? 'one-time'
                      : st === 'on startup' ? 'on startup'
                      : st === 'on idle' ? 'on idle'
                      : 'recurring';

    if (data.loungeGroupName) {
      this.selectedGroups = [data.loungeGroupName];
    }
    if (st === 'recurring' && data.frequency) {
      const freq = data.frequency.toLowerCase();
      this.occursType = freq === 'daily' ? 'daily' : freq === 'weekly' ? 'weekly' : 'monthly';
      this.recurrenceInterval = data.recurrenceInterval || 1;
      if (data.startDate) this.startDate = this.formatDate(data.startDate);
      if (data.endDate)   { this.endDate = this.formatDate(data.endDate); this.noEndDate = false; }
      else                { this.noEndDate = true; }
      if (data.startTime) this.startingTime = data.startTime.substring(0, 5);
      if (data.endTime)   this.endingTime   = data.endTime.substring(0, 5);
      if (data.weeklyDays) {
        const days = data.weeklyDays.toLowerCase().split(',').map((d: string) => d.trim());
        this.weeklyMonday    = days.includes('monday');
        this.weeklyTuesday   = days.includes('tuesday');
        this.weeklyWednesday = days.includes('wednesday');
        this.weeklyThursday  = days.includes('thursday');
        this.weeklyFriday    = days.includes('friday');
        this.weeklySaturday  = days.includes('saturday');
        this.weeklySunday    = days.includes('sunday');
      }
    }
    if (st === 'one-time' && data.occursOnceAt) {
      const dt = new Date(data.occursOnceAt);
      this.oneTimeScheduleDate = this.formatDate(dt);
      this.oneTimeScheduleTime = this.formatTime(dt);
    }
    if (st === 'on idle' && data.maxIdleLoopDuration) {
      this.maxIdleLoopDuration = data.maxIdleLoopDuration;
    }
    
    if (this.viewData.selectedTimeSlots && this.viewData.selectedTimeSlots.length > 0) {
      // Find matching period from trafficTimePeriods to populate selectedTrafficLevel and selectedTimePeriodName
      const firstSlot = this.viewData.selectedTimeSlots[0];
      const slotStartTime = firstSlot.split('-')[0];
      for (const p of this.trafficTimePeriods) {
         if (slotStartTime >= p.startTime && slotStartTime < p.endTime) {
            this.selectedTrafficLevel = p.trafficLevel;
            this.selectedTimePeriodName = p.name;
            break;
         }
      }
      this.onTimePeriodChange();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onCategoryChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.isEmergencyCategory = val.toLowerCase() === 'emergency';
    if (this.isEmergencyCategory) {
      this.viewData.priority = 'high';
      this.scheduleType = 'recurring';
    }
  }

  isGroupSelected(group: string): boolean {
    return this.selectedGroups.includes(group);
  }

  toggleGroup(group: string): void {
    const idx = this.selectedGroups.indexOf(group);
    if (idx > -1) this.selectedGroups.splice(idx, 1);
    else          this.selectedGroups.push(group);
  }

  removeGroup(group: string): void {
    this.selectedGroups = this.selectedGroups.filter(g => g !== group);
  }

  clearAllGroups(): void {
    this.selectedGroups = [];
  }

  get hasValidAdName(): boolean {
    return !!this.viewData.name?.trim();
  }

  get hasValidAdDuration(): boolean {
    const d = parseInt((this.viewData.duration || '').replace(/\D/g, ''), 10);
    return !isNaN(d) && d > 0 && d <= this.maxAllowedAdDurationSeconds;
  }

  get hasAdMedia(): boolean {
    if (this.selectedFile) return true;
    if (this.isEditMode) return !!(this.viewData.fileName || this.viewData.mediaUrl);
    return false;
  }

  get canSaveAdvertisement(): boolean {
    if (this.isViewMode || this.isSaving) return false;
    return this.hasValidAdName && this.hasValidAdDuration && this.hasAdMedia &&
           this.selectedGroups.length > 0 && !!this.viewData.priority;
  }

  async saveAdvertisement(): Promise<void> {
    if (!this.canSaveAdvertisement) return;
    this.isSaving = true;

    try {
      let mediaUrl = this.viewData.mediaUrl || '';
      let mediaType = '';

      // Upload file if a new one was selected
      if (this.selectedFile) {
        const uploaded = await this.advertisementService.uploadMedia(this.selectedFile).toPromise();
        if (uploaded) {
          mediaUrl  = uploaded.mediaUrl;
          mediaType = uploaded.mediaType;
        }
      }

      const durationSeconds = parseInt(
        (this.viewData.duration || '0').replace(/\D/g, ''), 10
      );

      const payload: any = {
        advertisementName:     this.viewData.name,
        advertisementCategory: this.viewData.category,
        mediaDuration:         durationSeconds,
        mediaUrl,
        mediaType,
        loungeGroupName:       this.selectedGroups.join(', '),
        priority:              this.viewData.priority.toLowerCase(),
        scheduleType:          this.scheduleType.toLowerCase(),
        status:                this.isEnabled ? 'active' : 'paused',
        description:           this.viewData.description || '',
        selectedTimeSlots:     this.availableCycles.filter(c => c.selected).map(c => c.id).join(',')
      };

      if (this.scheduleType === 'recurring') {
        payload.frequency          = this.occursType.toLowerCase();
        payload.recurrenceInterval = this.recurrenceInterval;
        payload.startDate          = this.startDate;
        payload.endDate            = this.noEndDate ? null : this.endDate;
        payload.startTime          = this.startingTime;
        payload.endTime            = this.endingTime;
        if (this.occursType === 'weekly') {
          const days: string[] = [];
          if (this.weeklyMonday)    days.push('Monday');
          if (this.weeklyTuesday)   days.push('Tuesday');
          if (this.weeklyWednesday) days.push('Wednesday');
          if (this.weeklyThursday)  days.push('Thursday');
          if (this.weeklyFriday)    days.push('Friday');
          if (this.weeklySaturday)  days.push('Saturday');
          if (this.weeklySunday)    days.push('Sunday');
          payload.weeklyDays = days.join(',');
        }
        if (this.occursType === 'monthly') {
          if (this.monthlyType === 'dayOfMonth') {
            payload.monthlyDayOfMonth = this.monthlyDayOfMonth;
          } else {
            payload.monthlyWeek = this.monthlyWeek.toLowerCase();
            payload.monthlyDay  = this.monthlyDay.toLowerCase();
          }
        }
        if (this.frequencyType === 'once') {
          payload.occursOnceAt = this.convertToUTC(this.startDate, this.occursOnceTime);
        } else {
          payload.occursEveryInterval = this.occursEveryInterval;
        }
      } else if (this.scheduleType === 'one-time') {
        payload.occursOnceAt = this.convertToUTC(this.oneTimeScheduleDate, this.oneTimeScheduleTime);
      } else if (this.scheduleType === 'on idle') {
        payload.maxIdleLoopDuration = this.maxIdleLoopDuration;
      }

      if (this.isEditMode) {
        const adId = this.viewData.addNo;
        await this.advertisementService.updateAdvertisement(adId, payload).toPromise();
        alert('Advertisement updated successfully.');
      } else {
        await this.advertisementService.createAdvertisement(payload).toPromise();
        alert('Advertisement created successfully.');
      }

      this.closeModal();
      this.loadAdvertisements();
    } catch (err: any) {
      console.error('Save error:', err);
      alert(err?.error?.error || err?.message || 'Failed to save advertisement');
    } finally {
      this.isSaving = false;
    }
  }

  deleteAdvertisement(ad: any): void {
    const adId   = ad?.originalData?.id || ad?.addNo;
    const adName = ad?.name || 'this advertisement';
    if (!adId) { alert('Missing advertisement ID.'); return; }
    if (!confirm(`Are you sure you want to delete "${adName}"?`)) return;

    this.advertisementService.deleteAdvertisement(adId).subscribe({
      next: () => { alert('Deleted successfully.'); this.loadAdvertisements(); },
      error: (err) => alert(err?.error?.error || 'Failed to delete advertisement')
    });
  }

  // ── Group Modal ───────────────────────────────────────────────────────────
  openGroupModal(): void {
    if (this.availableLounges.length === 0) this.loadLounges();
    this.isViewGroupMode = false;
    this.isEditGroupMode = false;
    this.selectedLounges = [];
    this.loungeSearchTerm = '';
    this.showLoungeDropdown = false;
    this.groupData = { id: '', groupName: '', lounges: [] as any };
    this.showGroupModal = true;
  }

  viewGroup(group: AdvertisementGroup): void {
    this.isViewGroupMode = true;
    this.isEditGroupMode = false;
    this.populateGroupForm(group);
    this.showGroupModal = true;
  }

  editGroup(group: AdvertisementGroup): void {
    this.isEditGroupMode = true;
    this.groupData.groupName = group.groupName;
    this.groupData.id = group.id;
    try {
      this.selectedLounges = group.lounges ? JSON.parse(group.lounges) : [];
    } catch (e) {
      this.selectedLounges = group.lounges ? group.lounges.split(',').map(l => l.trim()) : [];
    }
    this.showGroupModal = true;
  }

  closeGroupModal(): void {
    this.showGroupModal = false;
    this.showLoungeDropdown = false;
  }

  populateGroupForm(group: AdvertisementGroup): void {
    this.groupData = { id: group.id, groupName: group.groupName, lounges: [] as any };
    const lounges = this.parseLounges(group.lounges);
    this.selectedLounges = [...lounges];
  }

  parseLounges(raw: string): string[] {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { /* ignore */ }
    return raw.split(',').map(l => l.trim()).filter(Boolean);
  }

  isLoungeSelected(lounge: string): boolean {
    return this.selectedLounges.includes(lounge);
  }

  toggleLounge(lounge: string): void {
    const idx = this.selectedLounges.indexOf(lounge);
    if (idx > -1) this.selectedLounges.splice(idx, 1);
    else          this.selectedLounges.push(lounge);
  }

  removeLounge(lounge: string): void {
    this.selectedLounges = this.selectedLounges.filter(l => l !== lounge);
  }

  clearAllLounges(): void { this.selectedLounges = []; }

  isAllLoungesSelected(): boolean {
    return this.availableLounges.length > 0 &&
           this.availableLounges.every(l => this.selectedLounges.includes(l));
  }

  toggleSelectAll(): void {
    if (this.isAllLoungesSelected()) this.selectedLounges = [];
    else this.selectedLounges = [...this.availableLounges];
  }

  saveGroup(): void {
    if (!this.groupData.groupName.trim()) {
      alert('Group name is required.');
      return;
    }

    const payload: AdvertisementGroupCreateRequest = {
      groupName: this.groupData.groupName.trim(),
      lounges:   JSON.stringify(this.selectedLounges)
    };

    if (this.isEditGroupMode) {
      this.advertisementService.updateGroup(this.groupData.id, payload).subscribe({
        next: () => { alert('Group updated.'); this.closeGroupModal(); this.loadGroups(); },
        error: (err) => alert(err?.error?.error || 'Failed to update group')
      });
    } else {
      this.advertisementService.createGroup(payload).subscribe({
        next: () => { alert('Group created.'); this.closeGroupModal(); this.loadGroups(); },
        error: (err) => alert(err?.error?.error || 'Failed to create group')
      });
    }
  }

  deleteGroup(group: AdvertisementGroup): void {
    if (!confirm(`Delete group "${group.groupName}"?`)) return;
    this.advertisementService.deleteGroup(group.id).subscribe({
      next: () => { alert('Group deleted.'); this.loadGroups(); },
      error: (err) => alert(err?.error?.error || 'Failed to delete group')
    });
  }

  // ── Profile / notifications ───────────────────────────────────────────────
  toggleNotificationPanel(): void { this.showNotificationPanel = !this.showNotificationPanel; }
  closeNotificationPanel(): void  { this.showNotificationPanel = false; }
  toggleProfileMenu(): void       { this.showProfileMenu = !this.showProfileMenu; }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_user');
    this.router.navigate(['/login']);
  }

  // ── Cycle Generation ─────────────────────────────────────────────────────────
  onTimePeriodChange(): void {
    this.generateCycles();
  }

  generateCycles(): void {
    this.availableCycles = [];
    if (!this.selectedTimePeriodName || !this.selectedTrafficLevel) return;
    
    const period = this.trafficTimePeriods.find(p => p.name === this.selectedTimePeriodName);
    if (!period) return;
    
    let currentStr = period.startTime;
    while (currentStr !== period.endTime) {
      const nextStr = this.addMinutes(currentStr, 30);
      const cycleId = `${currentStr}-${nextStr}`;
      
      let booked = 0;
      for (const ad of this.advertisements) {
        if (ad.originalData?.status?.toLowerCase() !== 'active') continue;
        if (ad.addNo === this.viewData.addNo) continue; // Skip self when editing
        
        const adGroups = ad.originalData?.loungeGroupName?.split(',').map((g: string) => g.trim()) || [];
        const intersects = this.selectedGroups.some(g => adGroups.includes(g));
        if (intersects) {
          const adSlots = ad.originalData?.selectedTimeSlots?.split(',') || [];
          if (adSlots.includes(cycleId)) {
             booked += (ad.originalData?.mediaDuration || 0);
          }
        }
      }
      
      const maxAdTime = this.maxAllowedAdDurationSeconds;
      this.availableCycles.push({
        id: cycleId,
        label: `${currentStr} - ${nextStr}`,
        startTime: currentStr,
        endTime: nextStr,
        bookedSeconds: booked,
        availableSeconds: Math.max(0, maxAdTime - booked),
        isFull: booked >= maxAdTime,
        selected: this.viewData.selectedTimeSlots?.includes(cycleId) || false
      });
      
      currentStr = nextStr;
    }
  }

  addMinutes(timeStr: string, mins: number): string {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + mins);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  toggleCycle(cycle: AdCycle): void {
    if (this.isViewMode) return;
    
    // Calculate new booking duration if we select this
    const myDuration = parseInt((this.viewData.duration || '0').replace(/\D/g, ''), 10);
    if (!cycle.selected && cycle.availableSeconds < myDuration) {
       alert(`Not enough available time in this slot. You need ${myDuration}s but only ${cycle.availableSeconds}s are available.`);
       return;
    }
    
    if (cycle.isFull && !cycle.selected) return;
    cycle.selected = !cycle.selected;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  formatDate(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  formatTime(val: any): string {
    if (!val) return '12:00';
    const d = new Date(val);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  convertToUTC(dateStr: string, timeStr: string): string {
    if (!dateStr || !timeStr) return '';
    const local = new Date(`${dateStr}T${timeStr}:00`);
    return local.toISOString();
  }

  initDefaultDates(): void {
    const today = new Date();
    this.startDate = this.formatDate(today);
    const next = new Date(today);
    next.setFullYear(next.getFullYear() + 1);
    this.endDate = this.formatDate(next);
    this.oneTimeScheduleDate = this.formatDate(today);
  }

  resetScheduleFields(): void {
    this.scheduleType = 'Recurring';
    this.occursType = 'Daily';
    this.frequencyType = 'once';
    this.recurrenceInterval = 1;
    this.occursOnceTime = '12:00';
    this.startingTime = '12:00';
    this.endingTime = '23:59';
    this.noEndDate = false;
    this.oneTimeScheduleTime = '12:00';
    this.weeklyMonday = false; this.weeklyTuesday = false;
    this.weeklyWednesday = false; this.weeklyThursday = false;
    this.weeklyFriday = false; this.weeklySaturday = false; this.weeklySunday = false;
    this.monthlyDayOfMonth = 1; this.monthlyWeek = 'First'; this.monthlyDay = 'Monday';
    this.monthlyType = 'dayOfMonth';
    this.occursEveryInterval = 1; this.occursEveryUnit = 'Hourly';
    this.maxIdleLoopDuration = 60;
    this.isEnabled = true;
  }
}
