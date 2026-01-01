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
    Bus: ['Company', 'Route', 'Permit Num', 'Register Num', 'Verification', 'No of Seat', 'Approved fare', 'Type', 'Status'],
    Lounge: ['Lounge Name', 'Owner', 'Capacity', 'Price', 'Marketplace', 'Status'],
    Driver: ['Name', 'Contact', 'License Num', 'Experience', 'Status'],
    Conductor: ['Name', 'Contact', 'License Num', 'Experience', 'Status'],
    'Lounge booking': ['Passenger ID', 'Lounge Name', 'Adults', 'Children', 'Status'],
    'Bus booking': ['Passenger ID', 'Bus ID', 'Departure', 'Payment Status', 'Booking Status']
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
        const searchValue = this.searchCriteria[attr]?.toLowerCase();
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
          case 'Verification':
            return bus.verification_status?.toLowerCase().includes(searchValue);
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
        const searchValue = this.searchCriteria[attr]?.toLowerCase();
        if (!searchValue) return true;

        switch (attr) {
          case 'Lounge Name':
            return lounge.lounge_name?.toLowerCase().includes(searchValue);
          case 'Owner':
            return lounge.lounge_owner?.toLowerCase().includes(searchValue);
          case 'Capacity':
            return lounge.capacity?.toString().includes(searchValue);
          case 'Price':
            return lounge.price_per_hour?.toString().includes(searchValue);
          case 'Marketplace':
            return lounge.marketplace?.toLowerCase().includes(searchValue);
          case 'Status':
            const status = typeof lounge.operational === 'string' ? lounge.operational : (lounge.operational ? 'open' : 'closed');
            return status.toLowerCase().includes(searchValue);
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
        const searchValue = this.searchCriteria[attr]?.toLowerCase();
        if (!searchValue) return true;

        switch (attr) {
          case 'Name':
            return driver.name?.toLowerCase().includes(searchValue);
          case 'Contact':
            return driver.contact_number?.toLowerCase().includes(searchValue);
          case 'License Num':
            return driver.license_number?.toLowerCase().includes(searchValue);
          case 'Experience':
            return driver.experience_years?.toString().includes(searchValue);
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
        const searchValue = this.searchCriteria[attr]?.toLowerCase();
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
        const searchValue = this.searchCriteria[attr]?.toLowerCase();
        if (!searchValue) return true;

        switch (attr) {
          case 'Passenger ID':
            const passengerInfo = (booking.passenger_name || booking.passenger_phone || '').toLowerCase();
            return passengerInfo.includes(searchValue);
          case 'Bus ID':
            return booking.bus_id?.toLowerCase().includes(searchValue);
          case 'Departure':
            return booking.departure_datetime?.toLowerCase().includes(searchValue);
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
          case 'Passenger ID':
            return booking.passenger_id?.toLowerCase().includes(searchValue);
          case 'Lounge Name':
            return booking.lounge_name?.toLowerCase().includes(searchValue);
          case 'Adults':
            return booking.adults?.toString().includes(searchValue);
          case 'Children':
            return booking.children?.toString().includes(searchValue);
          case 'Status':
            return booking.booking_status?.toLowerCase().includes(searchValue);
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
}
