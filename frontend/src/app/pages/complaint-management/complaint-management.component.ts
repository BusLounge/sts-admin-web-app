import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { NotificationService } from '../../core/services/notification.service';

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
    NotificationPanelComponent
  ],
  templateUrl: './complaint-management.component.html',
  styleUrls: ['./complaint-management.component.scss']
})
export class ComplaintManagementComponent implements OnInit {
  activeTab: string = 'All';
  showNotificationPanel = false;
  showProfileMenu = false;
  
  stats = [
    { title: 'Total Complaints', count: 20, icon: 'pi pi-users', color: 'blue' },
    { title: 'Pending Complaints', count: 2, icon: 'pi pi-clock', color: 'indigo' },
    { title: 'Inprogress Complaints', count: 8, icon: 'pi pi-check-circle', color: 'purple' },
    { title: 'Resolved Complaints', count: 10, icon: 'pi pi-check', color: 'green' }
  ];

  complaints: any[] = [];
  filteredComplaints: any[] = [];

  displayViewModal: boolean = false;
  displayEditModal: boolean = false;
  selectedComplaint: any = {};
  solutionText: string = '';

  constructor(private router: Router, public notificationService: NotificationService) {}

  ngOnInit() {
    this.loadComplaints();
    this.filterComplaints();
  }

  viewComplaint(complaint: any) {
    this.selectedComplaint = { ...complaint };
    this.solutionText = ''; 
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
    this.closeEditModal();
  }

  sendSolution() {
    console.log('Sending solution for:', this.selectedComplaint.id, this.solutionText);
    this.closeViewModal();
  }

  loadComplaints() {
    // Mock data based on the image
    this.complaints = [
      {
        id: 'C0001',
        role: 'Passenger',
        name: 'Piyadasa gamage',
        contact: '0771234567',
        category: 'Service Issue',
        message: 'Unprofessional behavior',
        media: 'Empty',
        dateTime: '2025-11-26 08:30',
        assignedTeam: 'Customer Service',
        resolvedBy: '',
        activity: '"Reassigned to Finance/Ticketing"',
        status: 'Pending',
        action: ''
      },
      {
        id: 'C0001',
        role: 'Passenger',
        name: 'Rishara Gamage',
        contact: '0771234567',
        category: 'Service Issue',
        message: 'Poor customer support',
        media: 'Empty',
        dateTime: '2025-11-26 08:30',
        assignedTeam: 'Customer Service',
        resolvedBy: '',
        activity: '"Escalated to CS Manager"',
        status: 'Escalated',
        action: ''
      },
      {
        id: 'C0001',
        role: 'Passenger',
        name: 'Kamal gamage',
        contact: '0771234567',
        category: 'Operations & Scheduling',
        message: 'Unexpected waiting time',
        media: 'Empty',
        dateTime: '2025-11-26 08:30',
        assignedTeam: 'Operations Team',
        resolvedBy: 'Mr. Nirmal',
        activity: '',
        status: 'Resolved',
        action: ''
      },
      {
        id: 'C0001',
        role: 'Passenger',
        name: 'Sunil gamage',
        contact: '0771234567',
        category: 'Ticketing & Fare',
        message: 'Overcharging',
        media: 'Empty',
        dateTime: '2025-11-26 08:30',
        assignedTeam: 'Finance/Ticketing',
        resolvedBy: '',
        activity: '"Escalated to Finance Manager"',
        status: 'In progress',
        action: ''
      },
      {
        id: 'C0001',
        role: 'Passenger',
        name: 'Sunimal gamage',
        contact: '0771234567',
        category: 'Vehicle & Facility',
        message: 'Broken seats',
        media: 'Image',
        dateTime: '2025-11-26 08:30',
        assignedTeam: 'Maintenance/Company',
        resolvedBy: 'Mr. Sumal',
        activity: '',
        status: 'Resolved',
        action: ''
      },
      // Driver Complaints
      {
        id: 'C0001',
        role: 'Driver',
        name: 'Piyadasa gamage',
        contact: '0771234567',
        category: 'Vehicle & Facility',
        message: 'Brake problems in Bus',
        media: 'Empty',
        dateTime: '2025-11-26 08:30',
        assignedTeam: 'Maintenance/Company',
        resolvedBy: '',
        activity: '"Reassigned to Finance/Ticketing"',
        status: 'Pending',
        action: ''
      },
      {
        id: 'C0001',
        role: 'Driver',
        name: 'Rishara Gamage',
        contact: '0771234567',
        category: 'Ticketing & Fare',
        message: 'Late salary',
        media: 'Empty',
        dateTime: '2025-11-26 08:30',
        assignedTeam: 'Finance/Ticketing',
        resolvedBy: '',
        activity: '"Escalated to CS Manager"',
        status: 'Escalated',
        action: ''
      },
      // Conductor Complaints
      {
        id: 'C0001',
        role: 'Conductor',
        name: 'Piyadasa gamage',
        contact: '0771234567',
        category: 'Vehicle & Facility',
        message: 'Brake problems in Bus',
        media: 'Empty',
        dateTime: '2025-11-26 08:30',
        assignedTeam: 'Maintenance/Company',
        resolvedBy: '',
        activity: '"Reassigned to Finance/Ticketing"',
        status: 'Pending',
        action: ''
      },
      {
        id: 'C0001',
        role: 'Conductor',
        name: 'Rishara Gamage',
        contact: '0771234567',
        category: 'Ticketing & Fare',
        message: 'Late salary',
        media: 'Empty',
        dateTime: '2025-11-26 08:30',
        assignedTeam: 'Finance/Ticketing',
        resolvedBy: '',
        activity: '"Escalated to CS Manager"',
        status: 'Escalated',
        action: ''
      }
    ];
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
}
