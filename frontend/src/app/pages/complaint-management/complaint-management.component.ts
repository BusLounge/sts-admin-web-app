import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { NotificationService } from '../../core/services/notification.service';
import { ComplaintService } from '../../core/services/complaint.service';
import { Complaint } from '../../core/models/complaint.model';

@Component({
  selector: 'app-complaint-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    DialogModule,
    TextareaModule,
    NavbarComponent,
    NotificationPanelComponent,
    RouterModule
  ],
  templateUrl: './complaint-management.component.html',
  styleUrls: ['./complaint-management.component.scss']
})
export class ComplaintManagementComponent implements OnInit {
  activeTab: string = 'All';
  showNotificationPanel = false;
  showProfileMenu = false;
  
  stats = [
    { title: 'Total Complaints', count: 0, icon: 'pi pi-users', color: 'blue' },
    { title: 'Pending Complaints', count: 0, icon: 'pi pi-clock', color: 'indigo' },
    { title: 'Inprogress Complaints', count: 0, icon: 'pi pi-check-circle', color: 'purple' },
    { title: 'Resolved Complaints', count: 0, icon: 'pi pi-check', color: 'green' }
  ];

  complaints: Complaint[] = [];
  filteredComplaints: Complaint[] = [];

  displayViewModal: boolean = false;
  displayEditModal: boolean = false;
  displayEscalationModal: boolean = false;
  selectedComplaint: any = {};
  solutionText: string = '';
  escalationInfo: any = null;
  isEscalating: boolean = false;

  constructor(
    private router: Router, 
    public notificationService: NotificationService,
    private complaintService: ComplaintService
  ) {}

  ngOnInit() {
    this.loadComplaints();
  }

  viewComplaint(complaint: any) {
    this.selectedComplaint = { ...complaint };
    this.solutionText = ''; 
    this.loadEscalationInfo(complaint.id);
    this.displayViewModal = true;
  }

  closeViewModal() {
    this.displayViewModal = false;
    this.selectedComplaint = {};
  }

  editComplaint(complaint: any) {
    this.selectedComplaint = { ...complaint };
    this.displayEditModal = true;
  }

  closeEditModal() {
    this.displayEditModal = false;
    this.selectedComplaint = {};
  }

  saveComplaint() {
    console.log('Saving complaint:', this.selectedComplaint);
    // Update complaint with activity notes
    if (this.selectedComplaint.id && this.selectedComplaint.activity) {
      this.complaintService.updateComplaintStatus(
        this.selectedComplaint.id, 
        'in_progress', 
        undefined, 
        this.selectedComplaint.activity
      ).subscribe({
        next: () => {
          console.log('Complaint updated successfully');
          this.loadComplaints();
        },
        error: (err) => console.error('Error updating complaint:', err)
      });
    }
    this.closeEditModal();
  }

  sendSolution() {
    console.log('Sending solution for:', this.selectedComplaint.id, this.solutionText);
    if (this.selectedComplaint.id && this.solutionText) {
      this.complaintService.updateComplaintStatus(
        this.selectedComplaint.id, 
        'resolved', 
        undefined, 
        this.solutionText
      ).subscribe({
        next: () => {
          console.log('Solution sent successfully');
          this.loadComplaints();
        },
        error: (err) => console.error('Error sending solution:', err)
      });
    }
    this.closeViewModal();
  }

  loadComplaints() {
    this.complaintService.loadComplaints().subscribe({
      next: (complaints) => {
        this.complaints = complaints;
        this.filterComplaints();
        this.updateStats();
      },
      error: (err) => console.error('Error loading complaints:', err)
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.filterComplaints();
  }

  filterComplaints() {
    if (this.activeTab === 'All') {
      this.filteredComplaints = this.complaints;
    } else {
      // Remove 's' from end if present to match role (e.g. Passengers -> Passenger)
      const role = this.activeTab.endsWith('s') ? this.activeTab.slice(0, -1) : this.activeTab;
      this.filteredComplaints = this.complaints.filter(c => c.role.includes(role) || (role === 'Bus Owner' && c.role === 'Bus Owner') || (role === 'Lounge owner' && c.role === 'Lounge owner'));
    }
  }

  updateStats() {
    const total = this.complaints.length;
    const pending = this.complaints.filter(c => c.status.toLowerCase() === 'pending').length;
    const inProgress = this.complaints.filter(c => c.status.toLowerCase() === 'in progress').length;
    const resolved = this.complaints.filter(c => c.status.toLowerCase() === 'resolved').length;

    this.stats = [
      { title: 'Total Complaints', count: total, icon: 'pi pi-users', color: 'blue' },
      { title: 'Pending Complaints', count: pending, icon: 'pi pi-clock', color: 'indigo' },
      { title: 'Inprogress Complaints', count: inProgress, icon: 'pi pi-check-circle', color: 'purple' },
      { title: 'Resolved Complaints', count: resolved, icon: 'pi pi-check', color: 'green' }
    ];
  }

  getComplaintsByRole(role: string) {
    return this.complaints.filter(c => c.role === role);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status.toLowerCase()) {
      case 'resolved': return 'success';
      case 'pending': return 'secondary';
      case 'in progress': return 'info';
      case 'escalated': return 'warn';
      default: return 'info';
    }
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
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  goUserProfile() {
    this.router.navigate(['/user-profile']);
  }

  loadEscalationInfo(complaintId: string) {
    this.complaintService.getComplaintEscalation(complaintId).subscribe({
      next: (data) => {
        this.escalationInfo = data;
        console.log('Escalation info loaded:', data);
      },
      error: (err) => {
        console.error('Error loading escalation info:', err);
        this.escalationInfo = null;
      }
    });
  }

  escalateComplaint(complaintId: string) {
    if (confirm('Are you sure you want to escalate this complaint to the next level?')) {
      this.isEscalating = true;
      this.complaintService.manualEscalateComplaint(complaintId, 'admin').subscribe({
        next: (response) => {
          console.log('Complaint escalated successfully:', response);
          alert('Complaint escalated successfully! SMS notification sent to the next level team.');
          this.loadEscalationInfo(complaintId);
          this.loadComplaints();
          this.isEscalating = false;
        },
        error: (err) => {
          console.error('Error escalating complaint:', err);
          alert('Failed to escalate complaint. Please try again.');
          this.isEscalating = false;
        }
      });
    }
  }

  getEscalationBadgeClass(level: number): string {
    switch(level) {
      case 1: return 'level-1';
      case 2: return 'level-2';
      case 3: return 'level-3';
      default: return '';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }
}
