import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { RatingModule } from 'primeng/rating';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

interface Feedback {
  id: string;
  role: string;
  name: string;
  message: string;
  rating: number;
  date: string;
  status: 'New' | 'Reviewed';
  reply?: string;
}

@Component({
  selector: 'app-feedback-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    SelectModule,
    RatingModule,
    ButtonModule,
    DialogModule,
    TextareaModule,
    NavbarComponent
  ],
  templateUrl: './feedback-management.component.html',
  styleUrls: ['./feedback-management.component.scss']
})
export class FeedbackManagementComponent {
  activeTab: string = 'Passenger';
  displayViewModal: boolean = false;
  selectedFeedback: Feedback | null = null;
  replyMessage: string = '';
  
  stats = [
    { title: 'Total Feedback', count: 5, icon: 'pi pi-users', color: 'blue' },
    { title: 'New Feedback', count: 3, icon: 'pi pi-clock', color: 'indigo' },
    { title: 'Reviewed Feedback', count: 2, icon: 'pi pi-check-circle', color: 'green' }
  ];

  feedbacks: Feedback[] = [
    { id: 'FB0001', role: 'Passenger', name: 'Piyadasa gamage', message: 'Bus was a bit crowded', rating: 3, date: '2025-11-26', status: 'New' },
    { id: 'FB0002', role: 'Passenger', name: 'Rishara Gamage', message: 'Bus was clean and comfortable', rating: 2, date: '2025-11-26', status: 'Reviewed' },
    { id: 'FB0003', role: 'Passenger', name: 'Rishara Gamage', message: 'The conductor was helpful', rating: 2, date: '2025-11-26', status: 'New' },
    { id: 'FB0004', role: 'Passenger', name: 'Sunil gamage', message: 'Ride was safe', rating: 1, date: '2025-11-26', status: 'Reviewed' },
    { id: 'FB0005', role: 'Passenger', name: 'Sunimal gamage', message: 'Bus was clean and comfortable', rating: 3, date: '2025-11-20', status: 'New' }
  ];

  statusOptions = [
    { label: 'New', value: 'New' },
    { label: 'Reviewed', value: 'Reviewed' }
  ];

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  get filteredFeedbacks() {
    if (this.activeTab === 'All') {
      return this.feedbacks;
    }
    return this.feedbacks.filter(f => f.role === this.activeTab || (this.activeTab === 'Passenger' && f.role === 'Passenger')); 
    // Note: The screenshot shows "Passenger" tab but data says "Passenger". 
    // The other tabs are Bus Owners, Lounge owners, Drivers, Conductors.
    // For now I'll just filter by role matching the tab name or simple logic.
  }

  viewFeedback(feedback: Feedback) {
    this.selectedFeedback = { ...feedback };
    this.replyMessage = feedback.reply || 'Your feedback has been reviewed. Thank you!';
    this.displayViewModal = true;
  }

  submitReply() {
    if (this.selectedFeedback) {
      // Find original feedback and update it
      const index = this.feedbacks.findIndex(f => f.id === this.selectedFeedback!.id);
      if (index !== -1) {
        this.feedbacks[index].reply = this.replyMessage;
        this.feedbacks[index].status = 'Reviewed';
      }
      this.displayViewModal = false;
      this.selectedFeedback = null;
    }
  }
}
