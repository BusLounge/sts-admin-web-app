import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

interface NotificationDetails {
  id: number;
  type: 'bus' | 'driver' | 'conductor' | 'passenger' | 'lounge' | 'booking';
  title: string;
  message: string;
  time: string;
  formData: any;
}

@Component({
  selector: 'app-notification-details',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './notification-details.component.html',
  styleUrls: ['./notification-details.component.scss']
})
export class NotificationDetailsComponent implements OnInit {
  sidebarOpen = true;
  currentPage = 'notification-details';
  notification: NotificationDetails | null = null;

  // Mock data for different notification types
  private notificationData: { [key: number]: NotificationDetails } = {
    1: {
      id: 1,
      type: 'bus',
      title: 'New Bus Added Request',
      message: 'A new bus registration request has been submitted: Bus No: NB-4587, Route: Colombo → Kandy. Awaiting approval.',
      time: '1 day ago',
      formData: {
        busNumber: 'NB-4587',
        capacity: 45,
        type: 'AC',
        status: 'Active',
        route: 'Colombo → Kandy',
        registrationDate: '2025-10-13',
        ownerName: 'Transport Solutions Ltd',
        contactNumber: '+94771234567'
      }
    },
    2: {
      id: 2,
      type: 'driver',
      title: 'New Driver Registration Request',
      message: 'Driver S. Perera has requested to join. License No: B5678921. Awaiting verification.',
      time: '1 day 1 hour ago',
      formData: {
        firstName: 'Sunil',
        lastName: 'Perera',
        licenseNumber: 'B5678921',
        licenseExpiry: '2027-12-31',
        experienceYears: 8,
        contactNumber: '+94771234568',
        email: 'sunil.perera@email.com',
        address: '123, Galle Road, Colombo 03'
      }
    },
    3: {
      id: 3,
      type: 'passenger',
      title: 'New Passenger Account Request',
      message: 'Passenger A. Wijesinghe has requested account approval. Please verify details.',
      time: '1 day 1 hour ago',
      formData: {
        firstName: 'Anura',
        lastName: 'Wijesinghe',
        email: 'anura.w@email.com',
        contactNumber: '+94771234569',
        nic: '199512345678',
        address: '456, Kandy Road, Kandy',
        dateOfBirth: '1995-05-15'
      }
    },
    4: {
      id: 4,
      type: 'conductor',
      title: 'New Conductor Registration Request',
      message: 'Conductor R. Silva has submitted registration details. Employee ID: C12345. Awaiting approval.',
      time: '1 day 1 hour ago',
      formData: {
        firstName: 'Ruwan',
        lastName: 'Silva',
        employeeId: 'C12345',
        experienceYears: 5,
        contactNumber: '+94771234570',
        email: 'ruwan.silva@email.com',
        address: '789, Main Street, Galle'
      }
    },
    5: {
      id: 5,
      type: 'lounge',
      title: 'New Lounge Registration Request',
      message: 'Premium Lounge Colombo has requested to be added to the system. Location: Terminal 2. Awaiting verification.',
      time: '1 day 1 hour ago',
      formData: {
        loungeName: 'Premium Lounge Colombo',
        location: 'Terminal 2, Colombo Central Bus Stand',
        capacity: 50,
        pricePerHour: 500,
        amenities: ['WiFi', 'AC', 'Food', 'Drinks', 'Shower', 'TV'],
        operatingHours: '06:00 - 22:00',
        contactNumber: '+94771234571'
      }
    },
    6: {
      id: 6,
      type: 'booking',
      title: 'New Bus Booking Modification',
      message: 'Booking ID: BB-1023 modification requested by Passenger M. Fernando. Route change from Galle → Kandy to Galle → Colombo.',
      time: '1 day 1 hour ago',
      formData: {
        bookingId: 'BB-1023',
        passengerName: 'M. Fernando',
        currentRoute: 'Galle → Kandy',
        requestedRoute: 'Galle → Colombo',
        journeyDate: '2025-10-20',
        seatsBooked: 2,
        reason: 'Change of destination due to personal reasons'
      }
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.notification = this.notificationData[parseInt(id)];
    }
    
    if (!this.notification) {
      this.router.navigate(['/dashboard']);
    }
  }

  onNavigate(page: string): void {
    this.router.navigate([`/${page}`]);
  }

  onLogout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  approveRequest(): void {
    if (this.notification) {
      alert(`Request approved: ${this.notification.title}`);
      // Here you would typically call an API to approve the request
      console.log('Approving notification:', this.notification);
      this.router.navigate(['/dashboard']);
    }
  }

  cancelRequest(): void {
    const confirmed = confirm('Are you sure you want to cancel this request?');
    if (confirmed && this.notification) {
      alert(`Request cancelled: ${this.notification.title}`);
      // Here you would typically call an API to cancel the request
      console.log('Cancelling notification:', this.notification);
      this.router.navigate(['/dashboard']);
    }
  }

  getFormFields(): { label: string; value: any; key: string }[] {
    if (!this.notification) return [];
    
    return Object.entries(this.notification.formData).map(([key, value]) => ({
      label: this.formatLabel(key),
      value: value,
      key: key
    }));
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }
}
