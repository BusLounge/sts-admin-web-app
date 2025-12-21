import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
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
    ToggleSwitchModule,
    NavbarComponent,
    NotificationPanelComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  activeSection: string = 'Profile Setting';
  showNotificationPanel = false;
  private isBrowser: boolean;
  private originalTheme: string = 'system';
  
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
    'System Appearance',
    'Security & Privacy'
  ];

  notificationSettings = {
    busNotification: true,
    driverNotification: true,
    conductorNotification: false,
    loungesNotification: true,
    loungeBookingNotification: true,
    busBookingNotification: true,
    complaintsNotification: true,
    feedbacks: true,
    complaints: true,
    
    quietHours: {
      enabled: true,
      duration: '1 hour'
    },
    desktopNotifications: true,
    unreadBadge: true,
    notificationSounds: true,
    emailAlerts: true,
    autoMarkRead: true
  };

  systemPreferences = {
    theme: 'light',
    language: 'English (United States)',
    timezone: '(UTC-08:00) Pacific Time (US & Canada)',
    dateFormat: 'MM/DD/YYYY'
  };

  securitySettings = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    allowNewDeviceLogin: true,
    lastLogin: '2025-12-10 10:45 AM',
    loggedInIp: '192.168.1.24',
    requirePasswordForSensitive: true,
    loginAlerts: true,
    failedLoginProtection: true
  };



  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.systemPreferences.theme = savedTheme;
        this.originalTheme = savedTheme;
      } else {
        this.systemPreferences.theme = 'system';
        this.originalTheme = 'system';
      }
    }
  }

  selectTheme(theme: string) {
    this.systemPreferences.theme = theme;
    if (this.isBrowser) {
      if (theme === 'system') {
        this.applySystemTheme();
      } else {
        this.applyTheme(theme);
      }
    }
  }

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

  resetPermissions() {
    this.permissionGroups.forEach(group => {
      group.selected = false;
      group.permissions.forEach(p => p.selected = false);
    });
  }

  updatePermissionsBasedOnUser(user: any) {
    this.resetPermissions();
    
    if (user.permissions === 'Full Access') {
      this.permissionGroups.forEach(group => {
        group.selected = true;
        group.permissions.forEach(p => p.selected = true);
      });
    } else {
      const perms = user.permissions.toLowerCase();
      
      this.permissionGroups.forEach(group => {
        let match = false;
        
        // Map permission string keywords to groups
        if (group.name === 'Bus Management' && (perms.includes('bus'))) match = true;
        else if (group.name === 'Driver & Conductor Management' && (perms.includes('driver') || perms.includes('conductor'))) match = true;
        else if (group.name === 'Lounge Management' && (perms.includes('lounge') || perms.includes('loung'))) match = true;
        else if (group.name === 'Bus & Lounge Bookings' && (perms.includes('booking'))) match = true;
        else if (group.name === 'Complaint' && (perms.includes('complaint'))) match = true;
        else if (group.name === 'Feedbacks' && (perms.includes('feedback'))) match = true;
        else if (group.name === 'Users & Roles' && (perms.includes('user') || perms.includes('role'))) match = true;
        else if (group.name === 'System Configuration' && (perms.includes('setting') || perms.includes('config'))) match = true;
        else if (group.name === 'Notifications' && (perms.includes('notification'))) match = true;

        if (match) {
          group.selected = true;
          group.permissions.forEach(p => p.selected = true);
        }
      });
    }
  }

  showAddUser() {
    this.userViewMode = 'add';
    this.resetNewUser();
    this.resetPermissions();
  }

  editUser(user: any) {
    this.userViewMode = 'edit';
    this.selectedUser = { 
      ...user, 
      contactNumber: user.contact,
      isActive: user.status === 'Active'
    }; 
    this.updatePermissionsBasedOnUser(user);
  }

  viewUser(user: any) {
    this.userViewMode = 'view';
    this.selectedUser = { 
      ...user, 
      contactNumber: user.contact,
      isActive: user.status === 'Active'
    };
    this.updatePermissionsBasedOnUser(user);
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

  saveNewUser() {
    // Generate ID
    const lastId = this.users.length > 0 ? parseInt(this.users[this.users.length - 1].id.substring(1)) : 0;
    const newId = 'U' + (lastId + 1).toString().padStart(3, '0');

    const permissionsStr = this.calculatePermissionsString();

    const newUserEntry = {
      id: newId,
      fullName: this.newUser.fullName,
      userName: this.newUser.userName,
      contact: this.newUser.contactNumber,
      email: this.newUser.email,
      lastActivity: 'Just now',
      role: this.newUser.role,
      permissions: permissionsStr,
      status: 'Active'
    };

    this.users = [...this.users, newUserEntry]; // Create new reference to trigger change detection if needed
    this.userViewMode = 'list';
    this.resetNewUser();
    this.resetPermissions();
  }

  updateUser() {
    const index = this.users.findIndex(u => u.id === this.selectedUser.id);
    if (index !== -1) {
      const permissionsStr = this.calculatePermissionsString();
      
      const updatedUser = {
        ...this.users[index],
        fullName: this.selectedUser.fullName,
        userName: this.selectedUser.userName,
        contact: this.selectedUser.contactNumber,
        email: this.selectedUser.email,
        role: this.selectedUser.role,
        permissions: permissionsStr,
        status: this.selectedUser.isActive ? 'Active' : 'Inactive'
      };

      const updatedUsers = [...this.users];
      updatedUsers[index] = updatedUser;
      this.users = updatedUsers;
      
      this.userViewMode = 'list';
      this.selectedUser = {};
      this.resetPermissions();
    }
  }

  private calculatePermissionsString(): string {
    const allGroupsSelected = this.permissionGroups.every(g => g.selected && g.permissions.every(p => p.selected));
    
    if (allGroupsSelected) {
      return 'Full Access';
    } else {
      const selectedGroupNames = this.permissionGroups
        .filter(g => g.selected || g.permissions.some(p => p.selected))
        .map(g => {
            // Simplified mapping for display
            if (g.name.includes('Bus Management')) return 'Manage buses';
            if (g.name.includes('Driver')) return 'drivers';
            if (g.name.includes('Lounge')) return 'lounges';
            if (g.name.includes('Booking')) return 'bookings';
            return g.name;
        });
      
      if (selectedGroupNames.length > 0) {
          let permissionsStr = selectedGroupNames.join(', ');
          if (permissionsStr.length > 30) {
              permissionsStr = permissionsStr.substring(0, 30) + '...';
          }
          return permissionsStr;
      } else {
          return 'Restricted';
      }
    }
  }


  activeSessions = [
    { username: 'Dinesh Priyash', device: 'Chrome on Windows', workstation: '192.168.1.1', time: '2024-10-24 14:30', status: 'Active' },
    { username: 'Dinesh Priyash', device: 'Safari on iPhone', workstation: '192.168.1.5', time: '2024-10-23 09:15', status: 'Idle' },
    { username: 'Dinesh Priyash', device: 'Firefox on Mac', workstation: '192.168.1.8', time: '2024-10-22 18:45', status: 'Expired' }
  ];

  privacySettings = {
    profileVisibility: {
      adminsOnly: true,
      operationsManagers: false,
      bookingManagers: false,
      everyone: false
    },
    exportControls: {
      adminsOnly: true,
      operationsManagers: true,
      bookingManagers: false,
      everyone: false
    },
    privacyNotifications: {
      viewSensitiveInfo: true,
      downloadReport: true,
      updatePrivacy: true
    }
  };

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
    this.router.navigate(['/user-profile']); 
  }

  saveSystemPreferences() {
    console.log('Saving system preferences:', this.systemPreferences);
    
    if (this.isBrowser) {
      const theme = this.systemPreferences.theme;
      this.originalTheme = theme; // Update original theme on save
      
      if (theme === 'system') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', theme);
      }
    }
  }

  private applyTheme(theme: string) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  private applySystemTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(prefersDark ? 'dark' : 'light');
  }

  cancelSystemPreferences() {
    console.log('Cancelling system preferences changes');
    // Revert to original theme
    this.selectTheme(this.originalTheme);
  }
}
