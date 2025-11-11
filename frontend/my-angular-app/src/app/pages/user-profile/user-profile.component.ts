import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent {
  profileImageUrl: string | ArrayBuffer | null = null;
  sidebarOpen = true;
  user = {
    name: 'John Doe',
    countryCode: '+971',
    mobile: '1234 1234',
    email: 'johndoe@gmail.com',
    about: 'Operations Admin',
    datejoined: '2023-01-15',
  };
  editUser = { ...this.user };

  onProfileImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileImageUrl = e.target?.result ?? null;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onSave() {
    this.user = { ...this.editUser };
  }

  constructor(private router: Router) {}

  onSidebarToggle() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onSidebarNavigate(page: string) {
    this.router.navigate([`/${page}`]);
  }

  onSidebarLogout() {
    this.router.navigate(['/login']);
  }

  notificationSettings = [
    { key: 'New bus', label: 'New bus ', desc: 'Lorem ipsum dolor sit amet adipiscing elit.', enabled: true },
    { key: 'New driver', label: 'New driver', desc: 'Lorem ipsum dolor sit amet adipiscing elit. Nunc vulp', enabled: true },
    { key: 'New conducto', label: 'New conductor ', desc: 'Lorem ipsum dolor sit amet adipiscing elit. Nunc vulp ipsum a', enabled: true },
    { key: 'New passenger', label: 'New passenger', desc: 'Lorem ipsum dolor sit amet adipiscing elit. Nunc vulp', enabled: true },
    { key: 'New lounge', label: 'New lounge', desc: 'Lorem ipsum dolor sit amet adipiscing elit. Nunc vulp', enabled: true },
    { key: 'Lounge bookings', label: 'Lounge bookings', desc: 'Lorem ipsum dolor sit amet adipiscing elit. Nunc vulp', enabled: true },
    { key: 'Bus booking', label: 'Bus bookings', desc: 'Lorem ipsum dolor sit amet adipiscing elit. Nunc vulp', enabled: true }
  ];

  notificationToggles = [
    { key: 'desktop', label: 'Enable Desktop Notifications', desc: 'Lorem ipsum dolor sit amet adipiscing elit.', enabled: true },
    { key: 'badge', label: 'Enable Unread Notification Badge', desc: 'Shows a red badge on the app icon when you have unread message', enabled: true },
    { key: 'email', label: 'Email Notifications', desc: 'Announcements & Updates', enabled: true },
    { key: 'sounds', label: 'Sounds', desc: 'Disable All Notification Sounds', enabled: false }
  ];
}
