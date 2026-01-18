import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BusService } from '../../core/services/bus.service';
import { LoungeService } from '../../core/services/lounge.service';
import { DriverService } from '../../core/services/driver.service';
import { ConductorService } from '../../core/services/conductor.service';
import { BusBookingService } from '../../core/services/bus-booking.service';
import { LoungeBookingService } from '../../core/services/lounge-booking.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {
  searchType: string = '';
  searchCriteria: any = {};
  searchResults: any[] = [];
  showProfileMenu = false;
  selectedAttributes: string[] = [];

  attributeOptions: { [key: string]: string[] } = {
    Bus: ['Company', 'Route', 'Permit Num', 'Register Num', 'Owner Verification', 'Permit Verify', 'Contact', 'No of Seat', 'Approved fare', 'Type', 'Status'],
    Lounge: ['Lounge Name', 'Owner', 'Contact', 'Address', 'Price per hour', 'Capacity', 'Operation', 'Verification'],
    Driver: ['Name', 'Contact', 'License Num', 'License Expire date', 'Experience', 'Hire date', 'Verification', 'Status'],
    Conductor: ['Name', 'Contact', 'License Num', 'Experience', 'Hire date', 'Verification', 'Status'],
    'Lounge booking': ['Passenger Name', 'Passenger Phone', 'Ref NUM', 'Lounge Name', 'Market place', 'Booking Type', 'Date and Time', 'Duration', 'No of Guests', 'Total Amount', 'Payment Status', 'Booking Status'],
    'Bus booking': ['Bus Number', 'Passenger Name', 'Passenger Phone', 'Ref NUM', 'Route', 'Date & Time', 'Bus Type', 'Seat No', 'Total Fare', 'Payment Status', 'Booking Status']
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private busService: BusService,
    private loungeService: LoungeService,
    private driverService: DriverService,
    private conductorService: ConductorService,
    private busBookingService: BusBookingService,
    private loungeBookingService: LoungeBookingService,
    public notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchType = params['type'] || 'Bus';
      const criteriaStr = params['criteria'];
      if (criteriaStr) {
        this.searchCriteria = JSON.parse(criteriaStr);
        this.selectedAttributes = Object.keys(this.searchCriteria).filter(key => this.searchCriteria[key]);
        this.performSearch();
      }
    });
  }

  performSearch() {
    switch (this.searchType) {
      case 'Bus':
        this.searchBuses();
        break;
      case 'Lounge':
        this.searchLounges();
        break;
      case 'Driver':
        this.searchDrivers();
        break;
      case 'Conductor':
        this.searchConductors();
        break;
      case 'Bus booking':
        this.searchBusBookings();
        break;
      case 'Lounge booking':
        this.searchLoungeBookings();
        break;
    }
  }

  private searchBuses() {
    const buses = this.busService.buses;
    this.searchResults = buses.filter(bus => {
      return Object.keys(this.searchCriteria).every(attr => {
        const searchValue = this.searchCriteria[attr]?.toLowerCase().trim();
        if (!searchValue) return true;

        switch (attr) {
          case 'Company':
            return bus.company_name?.toLowerCase().includes(searchValue);
          case 'Route':
            return bus.custom_route_name?.toLowerCase().includes(searchValue);
          case 'Permit Num':
            return bus.permit_number?.toLowerCase().includes(searchValue);
          case 'Register Num':
            return bus.license_plate?.toLowerCase().includes(searchValue);
          case 'Owner Verification':
            return bus.owner_verification_status?.toLowerCase().includes(searchValue);
          case 'Permit Verify':
            return bus.verification_status?.toLowerCase().includes(searchValue);
          case 'Contact':
            return bus.business_phone?.toLowerCase().includes(searchValue);
          case 'No of Seat':
            return bus.total_seats?.toString().includes(searchValue);
          case 'Approved fare':
            return bus.fare_per_seat?.toString().includes(searchValue);
          case 'Type':
            return bus.bus_type?.toLowerCase().includes(searchValue);
          case 'Status':
            return bus.status?.toLowerCase().includes(searchValue);
          default:
            return true;
        }
      });
    });
  }

  private searchLounges() {
    const lounges = this.loungeService.lounges;
    this.searchResults = lounges.filter(lounge => {
      return Object.keys(this.searchCriteria).every(attr => {
        const searchValue = this.searchCriteria[attr]?.toLowerCase().trim();
        if (!searchValue) return true;

        switch (attr) {
          case 'Lounge Name':
            return lounge.lounge_name?.toLowerCase().includes(searchValue);
          case 'Owner':
            return lounge.lounge_owner?.toLowerCase().includes(searchValue);
          case 'Contact':
            return lounge.lounge_contact?.toLowerCase().includes(searchValue);
          case 'Address':
            return lounge.address?.toLowerCase().includes(searchValue);
          case 'Price per hour':
            return lounge.price_per_hour?.toString().includes(searchValue);
          case 'Capacity':
            return lounge.capacity?.toString().includes(searchValue);
          case 'Operation':
            const status = typeof lounge.operational === 'string' ? lounge.operational : (lounge.operational ? 'open' : 'closed');
            return status.toLowerCase().includes(searchValue);
          case 'Verification':
            return lounge.verification?.toLowerCase().includes(searchValue);
          default:
            return true;
        }
      });
    });
  }

  private searchDrivers() {
    const drivers = this.driverService.drivers;
    this.searchResults = drivers.filter(driver => {
      return Object.keys(this.searchCriteria).every(attr => {
        const searchValue = this.searchCriteria[attr]?.toLowerCase().trim();
        if (!searchValue) return true;

        switch (attr) {
          case 'Name':
            return driver.name?.toLowerCase().includes(searchValue);
          case 'Contact':
            return driver.contact_number?.toLowerCase().includes(searchValue);
          case 'License Num':
            return driver.license_number?.toLowerCase().includes(searchValue);
          case 'License Expire date':
            return driver.license_expiry_date?.toLowerCase().includes(searchValue);
          case 'Experience':
            return driver.experience_years?.toString().includes(searchValue);
          case 'Hire date':
            return driver.hire_date?.toLowerCase().includes(searchValue);
          case 'Verification':
            return driver.verification_status?.toLowerCase().includes(searchValue);
          case 'Status':
            return driver.status?.toLowerCase().includes(searchValue);
          default:
            return true;
        }
      });
    });
  }

  private searchConductors() {
    const conductors = this.conductorService.conductors;
    this.searchResults = conductors.filter(conductor => {
      return Object.keys(this.searchCriteria).every(attr => {
        const searchValue = this.searchCriteria[attr]?.toLowerCase().trim();
        if (!searchValue) return true;

        switch (attr) {
          case 'Name':
            return conductor.name?.toLowerCase().includes(searchValue);
          case 'Contact':
            return conductor.contact_number?.toLowerCase().includes(searchValue);
          case 'License Num':
            return conductor.license_number?.toLowerCase().includes(searchValue);
          case 'Experience':
            return conductor.experience_years?.toString().includes(searchValue);
          case 'Hire date':
            return conductor.hire_date?.toLowerCase().includes(searchValue);
          case 'Verification':
            return conductor.verification_status?.toLowerCase().includes(searchValue);
          case 'Status':
            return conductor.status?.toLowerCase().includes(searchValue);
          default:
            return true;
        }
      });
    });
  }

  private searchBusBookings() {
    const bookings = this.busBookingService.bookings;
    this.searchResults = bookings.filter(booking => {
      return Object.keys(this.searchCriteria).every(attr => {
        const searchValue = this.searchCriteria[attr]?.toLowerCase().trim();
        if (!searchValue) return true;

        switch (attr) {
          case 'Bus Number':
            return booking.bus_number?.toLowerCase().includes(searchValue);
          case 'Passenger Name':
            return booking.passenger_name?.toLowerCase().includes(searchValue);
          case 'Passenger Phone':
            return booking.passenger_phone?.toLowerCase().includes(searchValue);
          case 'Ref NUM':
            return booking.booking_reference?.toLowerCase().includes(searchValue);
          case 'Route':
            return booking.route?.toLowerCase().includes(searchValue);
          case 'Date & Time':
            return booking.departure_datetime?.toLowerCase().includes(searchValue);
          case 'Bus Type':
            return booking.bus_type?.toLowerCase().includes(searchValue);
          case 'Seat No':
            return booking.seat_number?.toLowerCase().includes(searchValue);
          case 'Total Fare':
            return booking.total_fare?.toString().includes(searchValue);
          case 'Payment Status':
            return booking.payment_status?.toLowerCase().includes(searchValue);
          case 'Booking Status':
            return booking.booking_status?.toLowerCase().includes(searchValue);
          default:
            return true;
        }
      });
    });
  }

  private searchLoungeBookings() {
    const bookings = this.loungeBookingService.bookings;
    this.searchResults = bookings.filter(booking => {
      return Object.keys(this.searchCriteria).every(attr => {
        const searchValue = this.searchCriteria[attr]?.toLowerCase();
        if (!searchValue) return true;

        switch (attr) {
          case 'Passenger Name':
            return booking.passenger_name?.toLowerCase().includes(searchValue);
          case 'Passenger Phone':
            return booking.passenger_phone?.toLowerCase().includes(searchValue);
          case 'Ref NUM':
            return booking.booking_reference?.toLowerCase().includes(searchValue);
          case 'Lounge Name':
            return booking.lounge_name?.toLowerCase().includes(searchValue);
          case 'Market place':
            return booking.product_name?.toLowerCase().includes(searchValue);
          case 'Booking Type':
            return booking.booking_type?.toLowerCase().includes(searchValue);
          case 'Date and Time':
            return booking.scheduled_arrival?.toLowerCase().includes(searchValue);
          case 'Duration':
            return booking.pricing_type?.toLowerCase().includes(searchValue);
          case 'No of Guests':
            return booking.number_of_guests?.toString().includes(searchValue);
          case 'Total Amount':
            return booking.total_amount?.toString().includes(searchValue);
          case 'Payment Status':
            return booking.payment_status?.toLowerCase().includes(searchValue);
          case 'Booking Status':
            return booking.status?.toLowerCase().includes(searchValue);
          default:
            return true;
        }
      });
    });
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    this.router.navigate(['/login']);
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  selectSearchType(type: string) {
    this.searchType = type;
    this.selectedAttributes = [];
    this.searchCriteria = {};
    this.searchResults = [];
  }

  toggleAttribute(attribute: string) {
    const index = this.selectedAttributes.indexOf(attribute);
    if (index > -1) {
      this.selectedAttributes.splice(index, 1);
      delete this.searchCriteria[attribute];
    } else {
      this.selectedAttributes.push(attribute);
      this.searchCriteria[attribute] = '';
    }
  }

  isAttributeSelected(attribute: string): boolean {
    return this.selectedAttributes.includes(attribute);
  }

  executeSearch() {
    if (this.selectedAttributes.length === 0) {
      alert('Please select at least one search attribute');
      return;
    }

    const hasValue = this.selectedAttributes.some(attr => this.searchCriteria[attr]?.trim());
    if (!hasValue) {
      alert('Please enter at least one search value');
      return;
    }

    this.performSearch();
  }

  clearSearch() {
    this.selectedAttributes = [];
    this.searchCriteria = {};
    this.searchResults = [];
  }

  // Lounge booking status change methods
  changePaymentStatus(b: any, v: 'pending'|'paid'|'failed') {
    this.loungeBookingService.updatePaymentStatus(b.lounge_booking_id, v).subscribe({
      next: () => {
        b.payment_status = v;
      },
      error: (err) => {
        console.error('Error updating payment status:', err);
      }
    });
  }
  
  changeBookingStatus(b: any, v: 'confirmed'|'pending'|'cancelled'|'completed') {
    this.loungeBookingService.updateBookingStatus(b.lounge_booking_id, v).subscribe({
      next: () => {
        b.status = v;
      },
      error: (err) => {
        console.error('Error updating booking status:', err);
      }
    });
  }

  openEditModal(b: any) {
    // Navigate to lounge booking page with edit modal
    this.router.navigate(['/lounge-booking'], { 
      queryParams: { 
        edit: b.lounge_booking_id 
      } 
    });
  }
}
