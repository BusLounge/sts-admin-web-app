import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'home', 
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  { 
    path: 'settings', 
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) 
  },
  { 
    path: 'complaints', 
    loadComponent: () => import('./pages/complaint-management/complaint-management.component').then(m => m.ComplaintManagementComponent) 
  },
  { 
    path: 'complaints/assigned', 
    loadComponent: () => import('./pages/assigned-complaints/assigned-complaints.component').then(m => m.AssignedComplaintsComponent) 
  },
  { 
    path: 'bus-management', 
    loadComponent: () => import('./pages/bus-management/bus-management.component').then(m => m.BusManagementComponent) 
  },
  { 
    path: 'bus-owners', 
    loadComponent: () => import('./pages/bus-owners/bus-owners.component').then(m => m.BusOwnersComponent) 
  },
  { 
    path: 'bus-management/edit/:id', 
    loadComponent: () => import('./pages/bus-management/edit-bus.component').then(m => m.EditBusComponent) 
  },
  { 
    path: 'scheduled-trips', 
    loadComponent: () => import('./pages/scheduled-trips/scheduled-trips.component').then(m => m.ScheduledTripsComponent) 
  },
  { 
    path: 'driver-management', 
    loadComponent: () => import('./pages/driver-management/driver-management.component').then(m => m.DriverManagementComponent) 
  },
  { 
    path: 'driver-management/add', 
    loadComponent: () => import('./pages/driver-management/add-driver.component').then(m => m.AddDriverComponent) 
  },
  { 
    path: 'driver-management/edit/:id', 
    loadComponent: () => import('./pages/driver-management/edit-driver.component').then(m => m.EditDriverComponent) 
  },
  { 
    path: 'conductor-management', 
    loadComponent: () => import('./pages/conductor-management/conductor-management.component').then(m => m.ConductorManagementComponent) 
  },
  { 
    path: 'conductor-management/add', 
    loadComponent: () => import('./pages/conductor-management/add-conductor.component').then(m => m.AddConductorComponent) 
  },
  { 
    path: 'conductor-management/edit/:id', 
    loadComponent: () => import('./pages/conductor-management/edit-conductor.component').then(m => m.EditConductorComponent) 
  },
  { 
    path: 'passenger-management', 
    loadComponent: () => import('./pages/passenger-management/passenger-management.component').then(m => m.PassengerManagementComponent) 
  },
  { 
    path: 'passenger-management/add', 
    loadComponent: () => import('./pages/passenger-management/add-passenger.component').then(m => m.AddPassengerComponent) 
  },
  { 
    path: 'passenger-management/edit/:id', 
    loadComponent: () => import('./pages/passenger-management/edit-passenger.component').then(m => m.EditPassengerComponent) 
  },
  { 
    path: 'lounges-management', 
    loadComponent: () => import('./pages/lounge-management/lounges-management.component').then(m => m.LoungesManagementComponent) 
  },
  { 
    path: 'inventory-management', 
    loadComponent: () => import('./pages/inventory-management/inventory-management.component').then(m => m.InventoryManagementComponent) 
  },
  { 
    path: 'inventory-management/edit/:id', 
    loadComponent: () => import('./pages/inventory-management/edit-inventory-item.component').then(m => m.EditInventoryItemComponent) 
  },
  { 
    path: 'lounge-booking', 
    loadComponent: () => import('./pages/lounge-booking/lounge-booking.component').then(m => m.LoungeBookingComponent) 
  },
  { 
    path: 'lounge-booking/edit/:id', 
    loadComponent: () => import('./pages/lounge-booking/edit-lounge-booking.component').then(m => m.EditLoungeBookingComponent) 
  },
  { 
    path: 'bus-booking', 
    loadComponent: () => import('./pages/bus-booking/bus-booking.component').then(m => m.BusBookingComponent) 
  },
  { 
    path: 'seat-layouts', 
    loadComponent: () => import('./pages/seat-layouts/seat-layouts.component').then(m => m.SeatLayoutsComponent) 
  },
  { 
    path: 'notification-details', 
    loadComponent: () => import('./pages/notification-details/notification-details.component').then(m => m.NotificationDetailsComponent) 
  },
  { 
    path: 'search-results', 
    loadComponent: () => import('./pages/search-results/search-results.component').then(m => m.SearchResultsComponent) 
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) 
  },
  { 
    path: 'advertisement-management', 
    loadComponent: () => import('./pages/advertisement-management/advertisement-management.component').then(m => m.AdvertisementManagementComponent) 
  },
  { 
    path: 'route-management', 
    loadComponent: () => import('./pages/route-management/route-management.component').then(m => m.RouteManagementComponent) 
  },
  { 
    path: 'otp-management', 
    loadComponent: () => import('./pages/otp-management/otp-management.component').then(m => m.OtpManagementComponent) 
  },
  { 
    path: 'settlements', 
    loadComponent: () => import('./pages/settlement-management/settlement-overview/settlement-overview.component').then(m => m.SettlementOverviewComponent) 
  },
  { 
    path: 'refunds', 
    loadComponent: () => import('./pages/refund-management/refund-management.component').then(m => m.RefundManagementComponent) 
  },
  { path: '**', redirectTo: '' }
];
