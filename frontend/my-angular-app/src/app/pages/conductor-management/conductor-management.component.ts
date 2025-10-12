import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConductorService } from '../../core/services/conductor.service';
import { Conductor } from '../../core/models/conductor.model';

@Component({
  selector: 'app-conductor-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './conductor-management.component.html',
  styleUrls: ['./conductor-management.component.scss']
})
export class ConductorManagementComponent implements OnInit, AfterViewInit {
  conductors: Conductor[] = [];
  filteredConductors: Conductor[] = [];
  searchTerm: string = '';
  statusFilter: string = 'All';
  experienceLevels = ['0-2yrs', '3-5yrs', '6-10yrs', '10+yrs'];
  currentPage: string = 'conductor-management';
  sidebarOpen: boolean = true;

  showAddConductorModal = false;
  showEditConductorModal = false;

  newConductor: Omit<Conductor, 'conductor_id'> = {
    full_name: '',
    nic: '',
    phone_number: '',
    experience_years: 0,
    status: 'Active',
    assigned_bus_id: '',
    hired_date: new Date().toISOString().split('T')[0]
  };

  selectedConductor: Conductor | null = null;

  // Sorting properties
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Chart properties
  barChartData: any;
  barChartOptions: any;
  isBrowser: boolean;
  @ViewChild('barChartCanvas', { static: false }) barChartCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;

  constructor(private router: Router, private conductorService: ConductorService, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.conductorService.conductors$.subscribe(conductors => {
      this.conductors = conductors;
      this.filteredConductors = conductors;
      if (this.isBrowser) {
        this.updateBarChart();
      }
      // Apply current sorting to initial data
      if (this.sortColumn) {
        this.applySorting();
      }
    });
  }

  navigateTo(page: string) { this.router.navigate([`/${page}`]); }
  logout() { this.router.navigate(['/']); }

  addConductor() {
    this.showAddConductorModal = true;
  }

  closeAddConductorModal() {
    this.showAddConductorModal = false;
    this.newConductor = {
      full_name: '',
      nic: '',
      phone_number: '',
      experience_years: 0,
      status: 'Active',
      assigned_bus_id: '',
      hired_date: new Date().toISOString().split('T')[0]
    };
  }

  saveConductor() {
    if (this.newConductor.full_name && this.newConductor.nic && this.newConductor.phone_number) {
      this.conductorService.addConductor({
        full_name: this.newConductor.full_name,
        nic: this.newConductor.nic,
        phone_number: this.newConductor.phone_number,
        experience_years: this.newConductor.experience_years,
        status: this.newConductor.status,
        assigned_bus_id: this.newConductor.assigned_bus_id,
        hired_date: this.newConductor.hired_date
      });
      this.closeAddConductorModal();
    } else {
      alert('Please fill all required fields');
    }
  }

  updateConductor(conductor: Conductor) {
    this.selectedConductor = { ...conductor };
    this.showEditConductorModal = true;
  }

  closeEditConductorModal() {
    this.showEditConductorModal = false;
    this.selectedConductor = null;
  }

  saveEditConductor() {
    if (this.selectedConductor) {
      this.conductorService.updateConductor(this.selectedConductor);
      this.closeEditConductorModal();
    }
  }

  toggleStatus(conductor: Conductor) {
    const statusOptions: Array<'Active' | 'On Leave' | 'Resigned'> = ['Active', 'On Leave', 'Resigned'];
    const currentIndex = statusOptions.indexOf(conductor.status);
    conductor.status = statusOptions[(currentIndex + 1) % statusOptions.length];
    console.log(`${conductor.full_name} status changed to ${conductor.status}`);
  }

  deleteConductor(conductor: Conductor) {
    const confirmed = confirm(`Are you sure you want to delete ${conductor.full_name}?`);
    if (confirmed) {
      this.conductorService.deleteConductor(conductor.conductor_id);
      console.log(`${conductor.full_name} deleted`);
    }
  }

  exportConductorsPdf() {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Conductors Management Report', 14, 16);

    const tableHead = [['Conductor ID', 'Full Name', 'NIC', 'Phone', 'Experience', 'Status', 'Assigned Bus', 'Hire Date']];
    const tableBody = this.filteredConductors.map(c => [
      c.conductor_id,
      c.full_name,
      c.nic,
      c.phone_number,
      `${c.experience_years}yrs`,
      c.status,
      c.assigned_bus_id || 'Unassigned',
      new Date(c.hired_date).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 22,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('conductors-report.pdf');
  }

  // Stats helpers
  getTotalConductors(): number { return this.conductors.length; }
  getActiveCount(): number { return this.conductors.filter(c => c.status === 'Active').length; }
  getOnLeaveCount(): number { return this.conductors.filter(c => c.status === 'On Leave').length; }
  getResignedCount(): number { return this.conductors.filter(c => c.status === 'Resigned').length; }
  getAverageExperience(): number {
    if (this.conductors.length === 0) return 0;
    const total = this.conductors.reduce((sum, c) => sum + c.experience_years, 0);
    return Math.round(total / this.conductors.length);
  }

  // Filtered stats helpers for pie chart
  getFilteredTotalConductors(): number { return this.filteredConductors.length; }
  getFilteredActiveCount(): number { return this.filteredConductors.filter(c => c.status === 'Active').length; }
  getFilteredOnLeaveCount(): number { return this.filteredConductors.filter(c => c.status === 'On Leave').length; }
  getFilteredResignedCount(): number { return this.filteredConductors.filter(c => c.status === 'Resigned').length; }

  // Search and filter functionality
  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = this.conductors;

    // Apply status filter
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter(c => c.status === this.statusFilter);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(conductor =>
        conductor.full_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        conductor.nic.includes(this.searchTerm) ||
        conductor.phone_number.includes(this.searchTerm) ||
        conductor.conductor_id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        conductor.assigned_bus_id.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    this.filteredConductors = filtered;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'All';
    this.filteredConductors = this.conductors;
  }

  // Navigation methods
  goDashboard(): void { this.router.navigate(['/dashboard']); }
  goBusManagement(): void { this.router.navigate(['/bus-management']); }
  goPassengerManagement(): void { this.router.navigate(['/passenger-management']); }
  goLounges(): void { this.router.navigate(['/lounges']); }

  // Experience level calculations for charts
  getExperienceLevelCount(level: string): number {
    switch (level) {
      case '0-2yrs': return this.conductors.filter(c => c.experience_years >= 0 && c.experience_years <= 2).length;
      case '3-5yrs': return this.conductors.filter(c => c.experience_years >= 3 && c.experience_years <= 5).length;
      case '6-10yrs': return this.conductors.filter(c => c.experience_years >= 6 && c.experience_years <= 10).length;
      case '10+yrs': return this.conductors.filter(c => c.experience_years > 10).length;
      default: return 0;
    }
  }

  getExperienceLevelPercentage(level: string): number {
    const total = this.conductors.length || 1;
    return (this.getExperienceLevelCount(level) / total) * 100;
  }

  // Sorting functionality
  onSort(column: string): void {
    if (this.sortColumn === column) {
      // Toggle direction if same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, start with ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    this.filteredConductors = [...this.filteredConductors].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'full_name':
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case 'experience':
          aValue = a.experience_years;
          bValue = b.experience_years;
          break;
        case 'assigned_bus':
          aValue = a.assigned_bus_id || '';
          bValue = b.assigned_bus_id || '';
          break;
        case 'hire_date':
          aValue = new Date(a.hired_date);
          bValue = new Date(b.hired_date);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return ' ⇅'; // Both arrows for unsorted columns
    }
    return this.sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  getPieChartGradient(): string {
    const total = this.getFilteredTotalConductors();
    if (total === 0) return 'conic-gradient(gray 0deg 360deg)';

    const activeCount = this.getFilteredActiveCount();
    const onLeaveCount = this.getFilteredOnLeaveCount();
    const resignedCount = this.getFilteredResignedCount();

    const activePercent = (activeCount / total) * 360;
    const onLeavePercent = (onLeaveCount / total) * 360;
    const resignedPercent = (resignedCount / total) * 360;

    const activeEnd = activePercent;
    const onLeaveEnd = activeEnd + onLeavePercent;
    const resignedEnd = onLeaveEnd + resignedPercent;

    return `conic-gradient(var(--active) 0deg ${activeEnd}deg, var(--inactive) ${activeEnd}deg ${onLeaveEnd}deg, var(--gray) ${onLeaveEnd}deg ${resignedEnd}deg)`;
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.createChart();
    }
  }

  createChart(): void {
    if (this.barChartCanvas && this.barChartCanvas.nativeElement) {
      const ctx = this.barChartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['0-2yrs', '3-5yrs', '6-10yrs', '10+yrs'],
            datasets: [{
              data: [
                this.getExperienceLevelCount('0-2yrs'),
                this.getExperienceLevelCount('3-5yrs'),
                this.getExperienceLevelCount('6-10yrs'),
                this.getExperienceLevelCount('10+yrs')
              ],
              backgroundColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
              borderColor: ['#0046FF', '#a3a3a3', '#FAA533', '#FF6B6B'],
              borderWidth: 0.25
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      }
    }
  }

  updateBarChart(): void {
    if (this.chart) {
      this.chart.data.datasets[0].data = [
        this.getExperienceLevelCount('0-2yrs'),
        this.getExperienceLevelCount('3-5yrs'),
        this.getExperienceLevelCount('6-10yrs'),
        this.getExperienceLevelCount('10+yrs')
      ];
      this.chart.update();
    }
  }
}
