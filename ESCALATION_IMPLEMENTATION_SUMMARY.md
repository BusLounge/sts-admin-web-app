# Complaint Escalation System - Implementation Summary

## ✅ Implementation Complete

The manual and automatic complaint escalation system with SMS notifications has been successfully implemented!

## 🎯 Features Implemented

### Backend Implementation

#### 1. **Team Assignment Configuration**
- **File**: `backend/internal/config/assignment.go`
- Configurable team assignments for each escalation level
- Each assignment includes: Team Name, Role Name, Phone Number
- Categories: Service Issue, Operations & Scheduling, Vehicle & Facility, Safety & Security, Other

#### 2. **SMS Notification Service**
- **File**: `backend/internal/services/sms_service.go`
- Integration with eSMS API
- SMS templates for:
  - New complaint assignment
  - Complaint escalation
  - Complaint resolution
- Bulk SMS support for team notifications
- Graceful error handling

#### 3. **Escalation Service Updates**
- **File**: `backend/internal/services/escalation_service.go`
- Automatic SMS notifications on initial assignment
- Automatic SMS notifications on escalation
- Integration with team assignment configuration
- Escalation tracking and history

#### 4. **API Endpoints**
Added new endpoints in `backend/cmd/server/main.go`:

```
POST /api/complaints/:id/escalate          - Manual escalation
GET  /api/complaints/:id/escalation        - Get escalation info
GET  /api/escalation/stats                 - Escalation statistics
POST /api/escalation/complaint/:id/initialize - Initialize escalation
```

#### 5. **Environment Configuration**
- **File**: `backend/.env.example`
- Added SMS configuration variables:
  ```env
  ESMS_API_URL=https://api.esms.lk/v1/sms/send
  ESMS_API_KEY=your_esms_api_key_here
  ESMS_SENDER_ID=BusLounge
  ```

### Frontend Implementation

#### 1. **Updated Complaint Model**
- **File**: `frontend/src/app/core/models/complaint.model.ts`
- Added `ComplaintEscalation` interface
- Added `EscalationHistoryEntry` interface
- Enhanced complaint model with escalation data

#### 2. **Enhanced Complaint Service**
- **File**: `frontend/src/app/core/services/complaint.service.ts`
- Added `getComplaintEscalation()` method
- Added `manualEscalateComplaint()` method
- Added `getEscalationStats()` method
- Added `initializeEscalation()` method

#### 3. **Complaint Management UI**
- **Files**: 
  - `frontend/src/app/pages/complaint-management/complaint-management.component.ts`
  - `frontend/src/app/pages/complaint-management/complaint-management.component.html`
  - `frontend/src/app/pages/complaint-management/complaint-management.component.scss`

**New Features in UI**:
- ✅ **Escalation Status Display**: Shows current level, team, and escalation dates
- ✅ **Manual Escalation Button**: "Escalate to Next Level" button in view modal
- ✅ **Level Badges**: Visual indicators for escalation levels (Level 1, 2, 3)
- ✅ **Color-coded Levels**: 
  - Level 1: Blue
  - Level 2: Orange
  - Level 3: Red (Critical)
- ✅ **Real-time Updates**: Auto-refreshes after escalation
- ✅ **Status Protection**: Disabled for resolved complaints

## 📱 SMS Notification Templates

### New Complaint Assignment
```
Hello {Role},

You have been assigned a new complaint:

Complaint ID: {ID}
Category: {Category}

Please review and respond within 5 days.

Thank you!
```

### Complaint Escalated
```
Hello {Role},

A complaint has been escalated to you (Level {Level}):

Complaint ID: {ID}
Category: {Category}

This requires urgent attention. Please review immediately.

Thank you!
```

## 🔧 Configuration

### Backend Configuration

1. **Edit Team Assignments**
   - File: `backend/internal/config/assignment.go`
   - Update phone numbers and team names
   - Add/remove categories as needed

2. **Set Environment Variables**
   ```bash
   # Copy .env.example to .env
   cp backend/.env.example backend/.env
   
   # Edit .env and add your SMS credentials
   ESMS_API_KEY=your_actual_api_key
   ESMS_SENDER_ID=YourSenderID
   ```

### Team Assignment Example

```go
"Service Issue": {
    1: {"Customer Service", "Support Agent", "94771234567"},
    2: {"Customer Service", "Team Lead", "94771234568"},
    3: {"Customer Service", "Manager", "94771234569"},
}
```

## 🚀 How to Use

### Automatic Escalation
1. Complaint is created
2. Automatically assigned to Level 1
3. SMS sent to Level 1 team
4. After 5 days (if unresolved): Auto-escalate to Level 2 → SMS sent
5. After 10 days (if unresolved): Auto-escalate to Level 3 → SMS sent
6. Stays at Level 3 (max level)

### Manual Escalation
1. Open any complaint in the **Complaint Management** page
2. Click the **"View"** button (eye icon)
3. View the **Escalation Status** section showing:
   - Current escalation level
   - Assigned team
   - Next escalation date
   - Last escalated date
4. Click **"Escalate to Next Level"** button
5. Confirm the escalation
6. SMS automatically sent to next level team
7. Complaint refreshed with new escalation info

## 📊 Escalation Levels

| Level | Team Type | SMS Trigger | Max Days |
|-------|-----------|-------------|----------|
| 1 | Support Agent / Officer | On creation | 5 days |
| 2 | Team Lead / Manager | Auto or Manual | 5 days |
| 3 | Manager / Director | Auto or Manual | No limit |

## 🎨 UI Features

### Escalation Info Box
- **Visual Design**: Gradient background with colored left border
- **Level Badges**: Gradient buttons showing level number
- **Team Display**: Shows assigned team name
- **Date Information**: 
  - Next escalation due date
  - Last escalated timestamp
- **Responsive**: Works on all screen sizes

### Escalate Button
- **Color**: Orange/Warning style
- **Icon**: Up arrow (↑)
- **States**: 
  - Enabled: For pending/in-progress complaints
  - Disabled: For resolved complaints or during escalation
- **Confirmation**: Asks for user confirmation before escalating

## 📝 Logs & Monitoring

### Backend Logs
```
✅ Complaint escalation scheduler started (runs every 1 hour)
🔍 Running scheduled escalation check...
📊 Found 3 complaint(s) that need escalation
⬆️  Escalated complaint abc-123 from level 1 to level 2
📱 Sending escalation notification (Level 2) to 94771234568
✅ SMS sent successfully to 94771234568 (Reference: SMS-REF-123)
```

### Frontend Confirmation
```
✅ "Complaint escalated successfully! SMS notification sent to the next level team."
```

## 🔍 Testing

### Test Manual Escalation

1. **Via UI**:
   - Navigate to Complaint Management
   - Select any pending complaint
   - Click "Escalate to Next Level"

2. **Via API**:
   ```bash
   curl -X POST http://localhost:8080/api/complaints/{id}/escalate \
     -H "Content-Type: application/json" \
     -d '{"escalated_by": "admin_test"}'
   ```

### Test SMS (Optional)
If SMS is not configured, the system will log a warning but continue working:
```
⚠️ SMS service not configured - skipping SMS notification
```

## 📚 Documentation

- **Full Setup Guide**: `backend/SMS_ESCALATION_SETUP.md`
- **Team Assignments**: `backend/internal/config/assignment.go`
- **Environment Template**: `backend/.env.example`

## 🎯 Next Steps

1. **Configure SMS**:
   - Obtain eSMS API credentials
   - Update `.env` file with credentials
   - Test SMS sending

2. **Customize Teams**:
   - Edit `assignment.go` with real team phone numbers
   - Update team names and roles
   - Adjust escalation days if needed

3. **Test the System**:
   - Create test complaints
   - Test manual escalation
   - Verify SMS delivery
   - Check escalation history

4. **Monitor**:
   - Check backend logs for escalation activity
   - Monitor SMS delivery
   - Review escalation statistics

## ✨ Key Benefits

- ✅ **Automated Process**: No manual tracking needed
- ✅ **Real-time Notifications**: SMS alerts to responsible teams
- ✅ **Audit Trail**: Complete escalation history
- ✅ **Flexible Configuration**: Easy to adjust teams and timings
- ✅ **Manual Override**: Admins can escalate anytime
- ✅ **Visual Feedback**: Clear UI showing escalation status
- ✅ **Multi-level Support**: Up to 3 escalation levels
- ✅ **Category-based**: Different workflows for different issue types

## 🎉 Success!

Your complaint escalation system is now fully operational with both automatic and manual escalation capabilities, complete with SMS notifications!
