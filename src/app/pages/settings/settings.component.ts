import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, AvatarModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  activeSection: string = 'Profile Setting';
  
  userProfile = {
    fullName: 'Dinesh Priyash',
    userName: 'Din@Sh',
    accessLevel: 'Super Admin',
    dateJoined: '12/10/2025',
    contactNumber: '070 2345678',
    emergencyContact: '078 2345678',
    workEmail: 'Dinesh@Myprogmail.com'
  };

  menuItems = [
    'Profile Setting',
    'Users & Roles',
    'Notification Settings',
    'System Preferences',
    'Security & Privacy'
  ];

  setActiveSection(section: string) {
    this.activeSection = section;
  }

  saveProfile() {
    console.log('Saving profile...', this.userProfile);
    // Implement save logic here
  }
}
