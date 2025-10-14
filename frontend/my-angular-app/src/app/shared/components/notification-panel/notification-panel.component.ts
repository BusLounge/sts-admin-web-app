import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Notification {
  id: number;
  icon: string;
  title: string;
  message: string;
  time: string;
  type: 'bus' | 'driver' | 'conductor' | 'passenger' | 'lounge' | 'booking';
}

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent {
  @Output() close = new EventEmitter<void>();

  notifications: Notification[] = [
    {
      id: 1,
      icon: '🚌',
      title: 'New Bus Added Request',
      message: 'A new bus registration request has been submitted: Bus No: NB-4587, Route: Colombo → Kandy. Awaiting approval.',
      time: '1 day ago',
      type: 'bus'
    },
    {
      id: 2,
      icon: '👨‍✈️',
      title: 'New Driver Registration Request',
      message: 'Driver S. Perera has requested to join. License No: B5678921. Awaiting verification.',
      time: '1 day 1 hour ago',
      type: 'driver'
    },
    {
      id: 3,
      icon: '👤',
      title: 'New Passenger Account Request',
      message: 'Passenger A. Wijesinghe has requested account approval. Please verify details.',
      time: '1 day 1 hour ago',
      type: 'passenger'
    },
    {
      id: 4,
      icon: '🎫',
      title: 'New Conductor Registration Request',
      message: 'Conductor R. Silva has submitted registration details. Employee ID: C12345. Awaiting approval.',
      time: '1 day 1 hour ago',
      type: 'conductor'
    },
    {
      id: 5,
      icon: '🏢',
      title: 'New Lounge Registration Request',
      message: 'Premium Lounge Colombo has requested to be added to the system. Location: Terminal 2. Awaiting verification.',
      time: '1 day 1 hour ago',
      type: 'lounge'
    },
    {
      id: 6,
      icon: '📋',
      title: 'New Bus Booking Modification',
      message: 'Booking ID: BB-1023 modification requested by Passenger M. Fernando. Route change from Galle → Kandy to Galle → Colombo.',
      time: '1 day 1 hour ago',
      type: 'booking'
    }
  ];

  onClose(): void {
    this.close.emit();
  }

  viewFullNotification(notification: Notification): void {
    // You can implement navigation or modal opening here
    console.log('View full notification:', notification);
    alert(`Full Notification:\n\n${notification.title}\n\n${notification.message}`);
  }
}
