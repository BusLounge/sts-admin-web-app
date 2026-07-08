# STS Admin Web App - User Manual
Welcome to the **STS (Smart Transit System) Admin Web App**. This application is the central command center for overseeing transit operations, lounge facilities, staff, advertisements, passenger complaints, and system security. 
This manual is designed to guide you step-by-step through every feature of the system. 
---
## 1. Introduction & Getting Started
### 1.1 Login to the System
To access the platform, you must log in with your administrative credentials.
1. Navigate to the STS Admin Web App URL.
2. Enter your **Email Address** and **Password** in the respective fields.
3. Click the **Log In** button.
   *(Note: If Multi-Factor Authentication is enabled, you will be prompted to enter an OTP sent to your phone).*
> **Relevant Database Tables:** `admin_users`
> ![Screenshot: Login Page](placeholder_login_page.png)
### 1.2 Forgot / Reset Password
If you have forgotten your password:
1. Click on the **Forgot Password?** link on the Login page.
2. Enter your registered email address and click **Send OTP**.
3. Check your SMS/Email for the One-Time Password.
4. Enter the OTP along with your new password on the **Reset Password** screen.
> **Relevant Database Tables:** `admin_users`, `otp_master`
> ![Screenshot: Reset Password Page](placeholder_reset_password.png)
### 1.3 The Dashboard
Once logged in, you will land on the Dashboard. This is your central hub for high-level metrics.
- **Top Navigation Bar:** Contains your profile settings, notification bell, and quick actions.
- **Left Sidebar Navigation:** Use this menu to jump between different modules like Bus Management, Complaints, or Lounges.
- **Widgets:** Quickly view statistics like Total Active Buses, Open Complaints, and Recent Bookings.
> ![Screenshot: Main Dashboard](placeholder_dashboard.png)
### 1.4 Notification Bar
Located at the top right of your screen, the Notification Bar keeps you updated in real-time.
- **Alerts:** Instantly receive updates regarding new complaints, system warnings, pending approvals, and escalated issues.
- **Quick Actions:** Click on any notification to jump directly to the relevant ticket or module.
- **Mark as Read:** Clear older notifications to keep your feed organized.
> **Relevant Database Tables:** `admin_notifications`
---
## 2. Transport Operations Management
### 2.1 Bus Owners
This section manages the business owners who operate the buses.
1. Navigate to **Transport > Bus Owners** from the sidebar.
2. **To View:** A list of all registered bus owners will be displayed here, showing their verification status.
3. **To Add New:** Click the **Add Bus Owner** button. Fill in their Full Name, Business Email, Phone Number, and upload their verification documents. Click **Save**.
> **Relevant Database Tables:** `bus_owners`
> ![Screenshot: Bus Owners List](placeholder_bus_owners_list.png)
> ![Screenshot: Add Bus Owner Form](placeholder_add_bus_owner.png)
### 2.2 Bus Management
Manage the actual fleet of buses here.
1. Navigate to **Transport > Bus Management**.
2. **View Fleet:** See a list of all buses, their license plates, and their assigned routes.
3. **Register New Bus:** Click **Add Bus**. 
   - Select the Bus Owner from the dropdown.
   - Enter details: Bus Number, License Plate, Permit Number, Total Seats, and Bus Type.
   - Click **Submit**.
> **Relevant Database Tables:** `buses`
> ![Screenshot: Bus Management Screen](placeholder_bus_management.png)
### 2.3 Staff Management (Drivers & Conductors)
1. Navigate to **Transport > Driver Management** or **Conductor Management**.
2. You will see a list of staff members along with their employment status (Active, Inactive, Suspended).
3. **Verify Staff:** Click on a staff member's profile to view their uploaded documents (e.g., Driver's License). Click **Approve** or **Reject** to update their verification status.
> **Relevant Database Tables:** `bus_staff`, `bus_staff_employment`
> ![Screenshot: Driver Management List](placeholder_driver_management.png)
> ![Screenshot: Staff Verification Details](placeholder_staff_verification.png)
### 2.4 Route Management
Define the paths that buses travel.
1. Navigate to **Operations > Route Management**.
2. **Add a Route:** Click **Create Route**.
3. Enter the **Route Name** (e.g., "Colombo to Kandy").
4. Specify the **Origin City** and **Destination City**.
5. You can add specific **Stops** along the route and configure the estimated travel duration.
> **Relevant Database Tables:** `master_routes`, `route_stops`
> ![Screenshot: Route Management Screen](placeholder_route_management.png)
---
## 3. Lounge & Booking Management
### 3.1 Lounge Management
Manage the rest lounges available for passengers.
1. Navigate to **Facilities > Lounge Management**.
2. **Add a Lounge:** Click **Add Lounge**.
3. Provide the Lounge Name, Operating Hours, Capacity, and Price Per Hour.
4. **Amenities:** Check the boxes for available amenities (e.g., Wi-Fi, Food, Restrooms).
5. **Verification:** Admin supervisors must verify new lounges before they go live on the passenger app.
> **Relevant Database Tables:** `lounges`, `lounge_owners`, `lounge_marketplace_categories`
> ![Screenshot: Lounge Management List](placeholder_lounge_management.png)
> ![Screenshot: Lounge Creation Form](placeholder_add_lounge.png)
### 3.2 Lounge Bookings
Monitor passenger reservations for lounges.
1. Navigate to **Bookings > Lounge Booking**.
2. Here you can see a real-time list of all upcoming and past reservations.
3. Click on a booking to see if the passenger made any **Pre-Orders** (e.g., snacks or specific services).
> **Relevant Database Tables:** `lounge_bookings`, `lounge_booking_pre_orders`
> ![Screenshot: Lounge Bookings View](placeholder_lounge_bookings.png)
### 3.3 Bus Bookings
1. Navigate to **Bookings > Bus Booking**.
2. View passenger ticket reservations. 
3. The table displays the Passenger Name, Route, Departure Time, Seat Number, and Payment Status (e.g., Pending, Completed).
> **Relevant Database Tables:** `bookings`
> ![Screenshot: Bus Bookings View](placeholder_bus_bookings.png)
---
## 4. User & Support Management
### 4.1 Passenger Management
Oversee all end-users registered on the passenger application.
1. Navigate to **Users > Passenger Management**.
2. **View Profiles:** Access a directory of all registered passengers, showing contact information and account standing.
3. **Account Actions:** If a user violates terms of service, you can temporarily Suspend or permanently Block their account from this screen.
> **Relevant Database Tables:** `passengers`
> ![Screenshot: Passenger Management](placeholder_passenger_management.png)
### 4.2 Complaint Management
Handle tickets raised by passengers or staff.
1. Navigate to **Support > Complaint Management**.
2. You will see a list of all incoming issues categorized by Priority (High, Medium, Low) and Type (Bus Issue, Lounge Issue, App Issue).
3. **Resolve an Issue:** Click on a complaint to view details, photos, and location data. Enter your **Resolution Notes** and click **Mark as Resolved**.
> **Relevant Database Tables:** `report_issues`
> ![Screenshot: Complaint Management Board](placeholder_complaints.png)
### 4.3 Assigned Complaints & Escalations
1. Navigate to **Support > Assigned Complaints**.
2. These are complaints specifically assigned to *your* admin role. 
3. **Escalate:** If you cannot resolve an issue, click the **Escalate** button to push it to a higher-level supervisor.
> **Relevant Database Tables:** `complaint_escalations`, `complaint_escalation_history`
> ![Screenshot: Assigned Complaints View](placeholder_assigned_complaints.png)
---
## 5. Media & Logs
### 5.1 Advertisement Management
Control the digital signage in buses and lounges.
1. Navigate to **Media > Advertisement Management**.
2. **Upload Ad:** Click **Add Advertisement**.
3. Upload your media file (Video/Image).
4. **Schedule:** Set highly granular schedules. Choose specific dates, days of the week, or precise time slots.
5. **Assign:** Group ads together and assign them to specific lounges.
> **Relevant Database Tables:** `advertisements`, `advertisement_groups`
> ![Screenshot: Advertisement Dashboard](placeholder_advertisements.png)
> ![Screenshot: Advertisement Scheduling Form](placeholder_add_advertisement.png)
### 5.2 OTP Master (System Logs)
Audit and track all verification codes sent out by the system for troubleshooting login or registration issues.
1. Navigate to **System > OTP Master**.
2. **Log View:** See a complete history of OTPs dispatched to passengers and staff.
3. **Status Check:** Verify whether an OTP was successfully sent, expired, or actively used to aid user support queries.
> **Relevant Database Tables:** `otp_master`
> ![Screenshot: OTP Master Log](placeholder_otp_master.png)
---
## 6. Settings & Configurations
Navigate to **System > Settings** from the sidebar to access system configurations.
### 6.1 Profile Settings
- **Update Details:** Modify your personal admin profile, including your Name, Contact Number, and Profile Picture.
- **Security:** Change or update your login password.
### 6.2 Notification Settings
- **Channels:** Configure how you prefer to receive alerts (e.g., In-App, Email, or SMS).
- **Filtering:** Toggle specific notification categories on or off so you only receive alerts relevant to your role (e.g., disable Lounge alerts if you only manage Transport).
### 6.3 System Appearance
- **Themes:** Personalize your dashboard experience by toggling between **Light Mode** and **Dark Mode**.
- **Layout:** Adjust sidebar behavior (expanded/collapsed) based on your screen size preferences.
### 6.4 Users & Roles
Manage access rights for other administrative staff. 
1. **Add Admin:** Click **Create User** to invite a new staff member to the dashboard.
2. **Role Assignment:** Assign custom roles like *Super Admin*, *Support Staff*, or *Transport Manager*.
3. **Permissions Management:** Granularly define what modules each role can view, edit, or delete to ensure strict data security.
> **Relevant Database Tables:** `system_settings`, `admin_users`, `admin_roles`, `admin_permissions`
> ![Screenshot: Settings Screen](placeholder_settings.png)
> ![Screenshot: Users & Roles](placeholder_users_roles.png)
---
*End of Document*
What changed?
Added Section 1.4 Notification Bar under "Introduction & Getting Started".
Renamed Section 4 to "User & Support Management" and added Section 4.1 Passenger Management.
Added Section 5.2 OTP Master (System Logs) under "Media & Logs".
Created a dedicated Section 6 "Settings & Configurations" to break down Profile Settings, Notification Settings, System Appearance, and Users & Roles.