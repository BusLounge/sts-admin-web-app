import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, BusNotification, DriverNotification, ConductorNotification, LoungeNotification } from '../../../core/services/notification.service';
import { combineLatest } from 'rxjs';

export interface Notification {
  id: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  type: 'bus' | 'driver' | 'conductor' | 'passenger' | 'lounge' | 'booking';
  data?: any;
}

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router, private notificationService: NotificationService) {}

  notifications: Notification[] = [];

  ngOnInit() {
    combineLatest([
      this.notificationService.pendingBuses$,
      this.notificationService.pendingDrivers$,
      this.notificationService.pendingConductors$,
      this.notificationService.pendingLounges$
    ]).subscribe(([buses, drivers, conductors, lounges]) => {
      this.notifications = [
        ...buses.map(bus => this.mapBusToNotification(bus)),
        ...drivers.map(driver => this.mapDriverToNotification(driver)),
        ...conductors.map(conductor => this.mapConductorToNotification(conductor)),
        ...lounges.map(lounge => this.mapLoungeToNotification(lounge))
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
    this.router.navigate(['/notification-details'], { 
      queryParams: { id: notification.id, type: notification.type },
      state: { data: notification.data, type: notification.type }
    });
    this.close.emit();
  }
}
