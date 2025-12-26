import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';

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
  imports: [CommonModule, FormsModule, NavbarComponent, NotificationPanelComponent, RouterModule],
  templateUrl: './notification-details.component.html',
  styleUrls: ['./notification-details.component.scss']
})
export class NotificationDetailsComponent implements OnInit {
  showNotificationPanel = false;
  showSuccessModal = false;
  successModalTitle = '';
  successModalMessage = '';
  showCancelModal = false;
  cancelModalTitle = '';
  cancelModalMessage = '';
  cancellationReasons: string[] = [];
  selectedReasons: { [key: string]: boolean } = {};
  otherReasonText = '';
  notification: NotificationDetails | null = null;

  // Mock data for different notification types
  private notificationData: { [key: number]: NotificationDetails } = {
    1: {
      id: 1,
      type: 'bus',
      title: 'New Bus Added Request',
      message: 'A new bus registration request has been submitted: Bus No: NB-4587, Route: Colombo  Kandy. Awaiting approval.',
      time: '1 day ago',
      formData: {
        PermitNum: 'NB-4587',
        Seats: 45,
        type: 'AC',
        RegNum: 'WP-3456',
        route: 'Colombo  Kandy',
        "Approved fare": 2000,
        Company: 'Transport Solutions Ltd',
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
        DriverName: 'Perera',
        licenseNumber: 'B5678921',
        licenseExpiry: '2027-12-31',
        experienceYears: 8,
        contactNumber: '+94771234568',
        Hiredate: '2025-12-12',
        
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
        ConductorName: 'Ruwan',
        licenseNumber: 'B5678921',
        licenseExpiry: '2027-12-31',
        experienceYears: 8,
        contactNumber: '+94771234568',
        Hiredate: '2025-12-12',
      }
    },
    5: {
      id: 5,
      type: 'lounge',
      title: 'New Lounge Registration Request',
      message: 'Premium Lounge Colombo has requested to be added to the system. Location: Terminal 2. Awaiting verification.',
      time: '1 day 1 hour ago',
      formData: {
        loungeOwner: 'Shenol',
        LoungeName: 'Bedisha Lounge',
        capacity: 50,
        pricePerHour: 500,
        amenities: ['WiFi', 'AC', 'Food', 'Drinks', 'Shower', 'TV'],
        Marketplace:['Drinks', 'Food','Essentials'],
        operatingHours: '06:00 - 22:00',
        contactNumber: '+94771234571'
      }
    },
    6: {
      id: 6,
      type: 'booking',
      title: 'New Bus Booking Modification',
      message: 'Booking ID: BB-1023 modification requested by Passenger M. Fernando. Route change from Galle  Kandy to Galle  Colombo.',
      time: '1 day 1 hour ago',
      formData: {
        bookingId: 'BB-1023',
        passengerName: 'M. Fernando',
        currentRoute: 'Galle  Kandy',
        requestedRoute: 'Galle  Colombo',
        journeyDate: '2025-10-20',
        seatsBooked: 2,
        reason: 'Change of destination due to personal reasons'
      }
    }
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    // Try to get ID from query params or route params
    const id = this.route.snapshot.queryParamMap.get('id') || this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.notification = this.notificationData[Number(id)];
    } else {
      // Fallback for demo/testing if no ID provided
      this.notification = this.notificationData[1];
    }
  }

  toggleNotificationPanel() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel() {
    this.showNotificationPanel = false;
  }

  showProfileMenu = false;

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_user');
    this.router.navigate(['/login']);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  approveRequest(): void {
    if (this.notification) {
      let typeName = this.notification.type;
      // Capitalize first letter
      typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
      
      this.successModalTitle = `New ${typeName} added Successfully!!!`;
      this.successModalMessage = `The request to add a new ${this.notification.type} has been approved.\nThe ${this.notification.type} is now active in the system\nand ready for scheduling.\nThank you.`;
      this.showSuccessModal = true;
    }
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  sendApproval(): void {
    this.showSuccessModal = false;
    // Here you would typically call an API to approve the request
    console.log('Approving notification:', this.notification);
    this.router.navigate(['/dashboard']);
  }

  cancelRequest(): void {
    if (this.notification) {
      let typeName = this.notification.type;
      typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);

      this.cancelModalTitle = `New ${typeName} Addition Request Cancelled`;
      this.cancelModalMessage = `The request to add a new ${this.notification.type} has been cancelled.\nThe ${this.notification.type} has not been added to the system.\nThank you.`;
      
      this.cancellationReasons = [
        `${typeName} details were missing or incorrect.`,
        `A ${this.notification.type} with the same identifier already exists.`,
        `The request was not approved by the authorities.`,
        `System could not process the ${this.notification.type} addition.`
      ];
      
      // Reset selection
      this.selectedReasons = {};
      this.otherReasonText = '';
      
      this.showCancelModal = true;
    }
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
  }

  sendCancellation(): void {
    this.showCancelModal = false;
    console.log('Cancellation sent', {
      reasons: this.selectedReasons,
      other: this.otherReasonText
    });
    this.router.navigate(['/dashboard']);
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
