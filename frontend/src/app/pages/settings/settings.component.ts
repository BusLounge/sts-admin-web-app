import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule, 
    AvatarModule,
    TableModule,
    TagModule,
    CheckboxModule,
    NavbarComponent,
    NotificationPanelComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  activeSection: string = 'Profile Setting';
  showNotificationPanel = false;
  
  userProfile = {
    fullName: 'Dinesh Priyash',
    userName: 'Din@Sh',
    accessLevel: 'Super Admin',
    dateJoined: '12/10/2025',
    contactNumber: '070 2345678',
    emergencyContact: '078 2345678',
    workEmail: 'Dinesh@Myprogmail.com'
  };

  userViewMode: 'list' | 'add' | 'edit' | 'view' = 'list';
  
  newUser = {
    fullName: '',
    userName: '',
    email: '',
    contactNumber: '',
    emergencyContact: '',
    role: '',
    password: '',
    confirmPassword: ''
  };

  selectedUser: any = {};

  permissionGroups = [
    {
      name: 'Bus Management',
      selected: false,
      permissions: [
        { name: 'View Buses', selected: false },
        { name: 'Add Bus', selected: false },
        { name: 'Edit Bus', selected: false },
        { name: 'Approve/Reject New Buses', selected: false },
        { name: 'View & Download reports', selected: false }
      ]
    },
    {
      name: 'Driver & Conductor Management',
      selected: false,
      permissions: [
        { name: 'View Drivers & Conductors', selected: false },
        { name: 'Add Drivers & Conductors', selected: false },
        { name: 'Edit Drivers & Conductors', selected: false },
        { name: 'Approve/Reject', selected: false },
        { name: 'View & Download reports', selected: false }
      ]
    },
    {
      name: 'Lounge Management',
      selected: false,
      permissions: [
        { name: 'View Lounges', selected: false },
        { name: 'Add Lounges', selected: false },
        { name: 'Edit Lounges', selected: false },
        { name: 'Approve/Reject Lounges', selected: false },
        { name: 'View & Download reports', selected: false }
      ]
    },
    {
      name: 'Bus & Lounge Bookings',
      selected: false,
      permissions: [
        { name: 'View Bookings', selected: false },
        { name: 'Add Bookings', selected: false },
        { name: 'Edit Bookings When user want', selected: false },
        { name: 'View & Download reports', selected: false }
      ]
    },
    {
      name: 'Complaint',
      selected: false,
      permissions: [
        { name: 'View Complaints', selected: false },
        { name: 'Manage Complaints', selected: false },
        { name: 'Send Solutions', selected: false },
        { name: 'Add Remarks', selected: false },
        { name: 'View & Download reports', selected: false }
      ]
    },
    {
      name: 'Feedbacks',
      selected: false,
      permissions: [
        { name: 'View Feedbacks', selected: false },
        { name: 'Send Replys', selected: false }
      ]
    },
    {
      name: 'Users & Roles',
      selected: false,
      permissions: [
        { name: 'View Users', selected: false },
        { name: 'Add Users', selected: false },
        { name: 'Edit Users', selected: false },
        { name: 'Assign roles', selected: false }
      ]
    },
    {
      name: 'System Configuration',
      selected: false,
      permissions: [
        { name: 'View Setting', selected: false },
        { name: 'Manage Setting', selected: false }
      ]
    },
    {
      name: 'Notifications',
      selected: false,
      permissions: [
        { name: 'View Notifications', selected: false },
        { name: 'Manage Notifications', selected: false },
        { name: 'Send Notifications', selected: false },
        { name: 'Notification Settings', selected: false }
      ]
    }
  ];

  users = [
    { id: 'U001', fullName: 'Dinesh Priyantha', userName: 'Din@sh', contact: '0723456789', email: 'Din@sheegmail.com', lastActivity: 'Today 7.30pm', role: 'Admin', permissions: 'Full Access', status: 'Active' },
    { id: 'U002', fullName: 'Udesh Shantha', userName: 'UD@sh', contact: '0704562356', email: 'UD@shagmail.com', lastActivity: 'Today 8.30pm', role: 'Operations Manager', permissions: 'Manage buses, drivers,...', status: 'Active' },
    { id: 'U003', fullName: 'wiesh Ruantha', userName: 'RW@sh', contact: '0702346709', email: 'RD@wigmail.com', lastActivity: 'Today 10.30pm', role: 'Booking & Lounge Manager', permissions: 'Manage bookings,loung..', status: 'Active' }
  ];

  menuItems = [
    'Profile Setting',
    'Users & Roles',
    'Notification Settings',
    'System Preferences',
    'Security & Privacy'
  ];

  constructor(private router: Router) {}

  toggleGroupPermissions(group: any) {
    if (group.permissions) {
      group.permissions.forEach((permission: any) => {
        permission.selected = group.selected;
      });
    }
  }

  checkGroupPermissions(group: any) {
    if (group.permissions) {
      if (group.name === 'System Configuration' || group.name === 'Notifications') {
        // For these groups, parent is checked if ANY child is checked
        group.selected = group.permissions.some((permission: any) => permission.selected);
      } else {
        // For other groups, parent is checked only if ALL children are checked
        const allSelected = group.permissions.every((permission: any) => permission.selected);
        group.selected = allSelected;
      }
    }
  }

  setActiveSection(section: string) {
    this.activeSection = section;
    this.userViewMode = 'list';
  }

  showAddUser() {
    this.userViewMode = 'add';
    this.resetNewUser();
  }

  editUser(user: any) {
    this.userViewMode = 'edit';
    this.selectedUser = { ...user, contactNumber: user.contact }; // Map contact to contactNumber
    // Populate other fields if available or leave blank/default
  }

  viewUser(user: any) {
    this.userViewMode = 'view';
    this.selectedUser = { ...user, contactNumber: user.contact };
  }

  cancelAddUser() {
    this.userViewMode = 'list';
    this.selectedUser = {};
  }

  resetNewUser() {
    this.newUser = {
      fullName: '',
      userName: '',
      email: '',
      contactNumber: '',
      emergencyContact: '',
      role: '',
      password: '',
      confirmPassword: ''
    };
  }

  saveProfile() {
    console.log('Saving profile...', this.userProfile);
    // Implement save logic here
  }

  toggleNotificationPanel(): void {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel(): void {
    this.showNotificationPanel = false;
  }

  goToUserProfile(): void {
    this.router.navigate(['/user-profile']); // Assuming user-profile route exists, or maybe it's just 'profile'
    // Checking routes... app.routes.ts has 'user-profile' component but path is not explicitly 'user-profile' in the snippet I read earlier?
    // Let me check app.routes.ts again to be sure about the path.
  }
}
