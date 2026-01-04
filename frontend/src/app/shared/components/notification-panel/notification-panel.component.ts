import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService, BusNotification, DriverNotification, ConductorNotification, LoungeNotification, BusOwnerNotification } from '../../../core/services/notification.service';
import { BusService } from '../../../core/services/bus.service';
import { DriverService } from '../../../core/services/driver.service';
import { ConductorService } from '../../../core/services/conductor.service';
import { LoungeService } from '../../../core/services/lounge.service';
import { BusOwnerService } from '../../../core/services/bus-owner.service';
import { combineLatest } from 'rxjs';

export interface Notification {
  id: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  type: 'bus' | 'driver' | 'conductor' | 'passenger' | 'lounge' | 'booking' | 'bus-owner';
  data?: any;
}

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  constructor(
    private router: Router,
    private http: HttpClient,
    private notificationService: NotificationService,
    private busService: BusService,
    private driverService: DriverService,
    private conductorService: ConductorService,
    private loungeService: LoungeService,
    private busOwnerService: BusOwnerService
  ) {}

  notifications: Notification[] = [];
  showDetailsModal = false;
  selectedNotification: Notification | null = null;
  adminDocuments: string = '';
  showSuccessModal = false;
  successModalTitle = '';
  successModalMessage = '';
  isRejectionSuccess = false;
  showRejectModal = false;
  rejectReason: string = '';
  lastProcessedType: 'bus' | 'driver' | 'conductor' | 'lounge' | 'bus-owner' | null = null;

  ngOnInit() {
    combineLatest([
      this.notificationService.pendingBuses$,
      this.notificationService.pendingDrivers$,
      this.notificationService.pendingConductors$,
      this.notificationService.pendingLounges$,
      this.notificationService.pendingBusOwners$
    ]).subscribe(([buses, drivers, conductors, lounges, busOwners]) => {
      this.notifications = [
        ...buses.map(bus => this.mapBusToNotification(bus)),
        ...drivers.map(driver => this.mapDriverToNotification(driver)),
        ...conductors.map(conductor => this.mapConductorToNotification(conductor)),
        ...lounges.map(lounge => this.mapLoungeToNotification(lounge)),
        ...busOwners.map(busOwner => this.mapBusOwnerToNotification(busOwner))
      ];
    });
  }

  private mapBusToNotification(bus: BusNotification): Notification {
    const timeAgo = this.getTimeAgo(new Date());
    return {
      id: bus.id,
      icon: '🚌',
      title: 'New Bus Added Request',
      message: `A new bus registration request has been submitted: Bus No: ${bus.permit_number || bus.bus_number}, Route: ${bus.custom_route_name || 'Not specified'}. Awaiting approval.`,
      time: timeAgo,
      type: 'bus',
      data: bus
    };
  }

  private mapDriverToNotification(driver: DriverNotification): Notification {
    const timeAgo = this.getTimeAgo(new Date());
    return {
      id: driver.id,
      icon: '🚗',
      title: 'New Driver Added Request',
      message: `A new driver registration request has been submitted: ${driver.name}, License: ${driver.license_number}. Awaiting approval.`,
      time: timeAgo,
      type: 'driver',
      data: driver
    };
  }

  private mapConductorToNotification(conductor: ConductorNotification): Notification {
    const timeAgo = this.getTimeAgo(new Date());
    return {
      id: conductor.id,
      icon: '👤',
      title: 'New Conductor Added Request',
      message: `A new conductor registration request has been submitted: ${conductor.name}, License: ${conductor.license_number}. Awaiting approval.`,
      time: timeAgo,
      type: 'conductor',
      data: conductor
    };
  }

  private mapLoungeToNotification(lounge: LoungeNotification): Notification {
    const timeAgo = this.getTimeAgo(new Date());
    return {
      id: lounge.lounge_id,
      icon: '🛋️',
      title: 'New Lounge Added Request',
      message: `A new lounge registration request has been submitted: ${lounge.lounge_name}, Owner: ${lounge.lounge_owner}. Awaiting approval.`,
      time: timeAgo,
      type: 'lounge',
      data: lounge
    };
  }

  private mapBusOwnerToNotification(busOwner: BusOwnerNotification): Notification {
    const timeAgo = this.getTimeAgo(new Date());
    return {
      id: busOwner.id,
      icon: '👔',
      title: 'New Bus Owner Request',
      message: `A new bus owner registration request has been submitted: ${busOwner.company_name}, Email: ${busOwner.business_email}. Awaiting approval.`,
      time: timeAgo,
      type: 'bus-owner',
      data: busOwner
    };
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffMins > 0) {
      return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    } else {
      return 'Just now';
    }
  }

  onClose(): void {
    this.close.emit();
  }

  viewFullNotification(notification: Notification): void {
    this.selectedNotification = notification;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedNotification = null;
    this.adminDocuments = '';
    this.rejectReason = '';
  }

  approveRequest(): void {
    if (!this.selectedNotification) {
      return;
    }

    const type = this.selectedNotification.type;
    const id = this.selectedNotification.id;
    let approveObservable;
    
    // Prepare approval data with documents
    const approvalData = {
      documents: this.adminDocuments.trim()
    };
    
    switch (type) {
      case 'bus':
        approveObservable = this.notificationService.approveBus(id, approvalData);
        this.successModalTitle = 'New Bus added Successfully!!!';
        this.successModalMessage = `The request to add a new bus has been approved.\nThe bus is now active in the system\nand ready for scheduling.\nThank you.`;
        break;
      case 'driver':
        approveObservable = this.notificationService.approveDriver(id, approvalData);
        this.successModalTitle = 'New Driver added Successfully!!!';
        this.successModalMessage = `The request to add a new driver has been approved.\nThe driver is now active in the system\nand ready for assignment.\nThank you.`;
        break;
      case 'conductor':
        approveObservable = this.notificationService.approveConductor(id, approvalData);
        this.successModalTitle = 'New Conductor added Successfully!!!';
        this.successModalMessage = `The request to add a new conductor has been approved.\nThe conductor is now active in the system\nand ready for assignment.\nThank you.`;
        break;
      case 'lounge':
        approveObservable = this.notificationService.approveLounge(id, approvalData);
        this.successModalTitle = 'New Lounge added Successfully!!!';
        this.successModalMessage = `The request to add a new lounge has been approved.\nThe lounge is now active in the system\nand ready for booking.\nThank you.`;
        break;
      case 'bus-owner':
        // Convert comma-separated string to array of document links
        const documentLinks = this.adminDocuments.trim()
          .split(',')
          .map(link => link.trim())
          .filter(link => link.length > 0);
        
        console.log('Sending bus owner verification with documents:', documentLinks);
        approveObservable = this.notificationService.approveBusOwner(id, { verification_documents: documentLinks });
        this.successModalTitle = 'New Bus Owner added Successfully!!!';
        this.successModalMessage = `The request to add a new bus owner has been approved.\nThe bus owner is now verified in the system\nand ready to manage buses.\nThank you.`;
        break;
      default:
        return;
    }
    
    approveObservable.subscribe({
      next: () => {
        // Store the type before closing modal
        this.lastProcessedType = type;
        // Reload the respective service data after approval
        switch (type) {
          case 'bus':
            this.busService.loadBuses();
            break;
          case 'driver':
            this.driverService.loadDrivers();
            break;
          case 'conductor':
            this.conductorService.loadConductors();
            break;
          case 'lounge':
            this.loungeService.loadLounges();
            break;
          case 'bus-owner':
            this.busOwnerService.loadBusOwners();
            break;
        }
        this.closeDetailsModal();
        this.isRejectionSuccess = false;
        this.showSuccessModal = true;
      },
      error: (err) => {
        console.error(`Error approving ${type}:`, err);
        alert(`Failed to approve ${type}: ` + (err.error?.error || err.message));
      }
    });
  }

  openRejectModal(): void {
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
  }

  confirmRejectRequest(): void {
    if (!this.rejectReason || this.rejectReason.trim() === '') {
      alert('Please provide a reason for rejection.');
      return;
    }

    if (!this.selectedNotification) {
      return;
    }

    const type = this.selectedNotification.type;
    const id = this.selectedNotification.id;
    let rejectObservable;
    
    // Prepare rejection data with documents/reason
    const rejectionData = {
      documents: this.rejectReason.trim()
    };
    
    switch (type) {
      case 'bus':
        rejectObservable = this.notificationService.rejectBus(id, rejectionData);
        this.successModalTitle = 'Bus Request Rejected';
        this.successModalMessage = `The bus registration request has been rejected.\nReason: ${this.rejectReason}\nThank you.`;
        break;
      case 'driver':
        rejectObservable = this.notificationService.rejectDriver(id, rejectionData);
        this.successModalTitle = 'Driver Request Rejected';
        this.successModalMessage = `The driver registration request has been rejected.\nReason: ${this.rejectReason}\nThank you.`;
        break;
      case 'conductor':
        rejectObservable = this.notificationService.rejectConductor(id, rejectionData);
        this.successModalTitle = 'Conductor Request Rejected';
        this.successModalMessage = `The conductor registration request has been rejected.\nReason: ${this.rejectReason}\nThank you.`;
        break;
      case 'lounge':
        rejectObservable = this.notificationService.rejectLounge(id, rejectionData);
        this.successModalTitle = 'Lounge Request Rejected';
        this.successModalMessage = `The lounge registration request has been rejected.\nReason: ${this.rejectReason}\nThank you.`;
        break;
      case 'bus-owner':
        rejectObservable = this.notificationService.rejectBusOwner(id, { verification_documents: this.rejectReason.trim() });
        this.successModalTitle = 'Bus Owner Request Rejected';
        this.successModalMessage = `The bus owner registration request has been rejected.\nReason: ${this.rejectReason}\nThank you.`;
        break;
      default:
        return;
    }
    
    rejectObservable.subscribe({
      next: () => {
        // Store the type before closing modal
        this.lastProcessedType = type;
        // Reload the respective service data after rejection
        switch (type) {
          case 'bus':
            this.busService.loadBuses();
            break;
          case 'driver':
            this.driverService.loadDrivers();
            break;
          case 'conductor':
            this.conductorService.loadConductors();
            break;
          case 'lounge':
            this.loungeService.loadLounges();
            break;
          case 'bus-owner':
            this.busOwnerService.loadBusOwners();
            break;
        }
        this.closeRejectModal();
        this.closeDetailsModal();
        this.isRejectionSuccess = true;
        this.showSuccessModal = true;
      },
      error: (err) => {
        console.error(`Error rejecting ${type}:`, err);
        alert(`Failed to reject ${type}: ` + (err.error?.error || err.message));
      }
    });
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  sendApproval(): void {
    this.showSuccessModal = false;
    this.close.emit();
    
    // Navigate to appropriate management page based on last processed notification type
    if (this.lastProcessedType) {
      switch (this.lastProcessedType) {
        case 'bus':
          this.router.navigate(['/bus-management']);
          break;
        case 'driver':
          this.router.navigate(['/driver-management']);
          break;
        case 'conductor':
          this.router.navigate(['/conductor-management']);
          break;
        case 'lounge':
          this.router.navigate(['/lounges-management']);
          break;
      }
      this.lastProcessedType = null;
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
