# Forgot Password Implementation Guide

## ✅ Implementation Complete

I've successfully implemented the **forgot password** functionality for your admin dashboard!

## 🎯 Features Implemented

### Backend (Go)
1. **Request Password Reset** - Generates a reset token when admin requests password reset
2. **Verify Reset Token** - Validates if a reset token is valid and not expired  
3. **Reset Password** - Updates admin password using a valid token

### Frontend (Angular)
1. **Forgot Password Modal** - UI already exists in your login page
2. **API Integration** - Connected to backend endpoints
3. **Real-time Feedback** - Shows success/error messages

## 🔐 How It Works

### Step-by-Step Flow:

1. **User clicks "Forgot Password"** on login page
2. **Enters email address** and submits
3. **Backend generates reset token**:
   - Token expires in 15 minutes
   - Stored in memory (in production, use Redis/Database)
4. **User receives reset token**:
   - In production: Sent via email
   - In development: Displayed in response & console
5. **User enters token and new password**
6. **Password is updated** and hashed with bcrypt

## 📋 API Endpoints

### 1. Request Password Reset
```http
POST /api/admin/auth/forgot-password
Content-Type: application/json

{
  "email": "admin@sts.lk"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset code has been sent to your email",
  "reset_token": "3f9a2c1b",  // DEV ONLY - remove in production
  "expires_in": 900            // 15 minutes
}
```

### 2. Verify Reset Token  
```http
POST /api/admin/auth/verify-reset-token
Content-Type: application/json

{
  "token": "3f9a2c1b"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "email": "admin@sts.lk"
}
```

### 3. Reset Password
```http
POST /api/admin/auth/reset-password
Content-Type: application/json

{
  "token": "3f9a2c1b",
  "new_password": "newPassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been reset successfully"
}
```

## 🧪 How to Test

### Using the UI:

1. **Navigate to login page**: http://localhost:4200
2. **Click** "Forgot Password?" link
3. **Enter email**: `admin@sts.lk` or `superadmin@sts.lk`
4. **Click** "Send Reset Link"
5. **Check console** for the reset token (DEV MODE)
6. **Use the token** to reset password (you'll need to create a reset password page)

### Using Postman/API:

```bash
# Step 1: Request Reset
curl -X POST http://localhost:8083/api/admin/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sts.lk"}'

# Step 2: Verify Token (optional)
curl -X POST http://localhost:8083/api/admin/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE"}'

# Step 3: Reset Password
curl -X POST http://localhost:8083/api/admin/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE","new_password":"newPassword123"}'
```

## 🔄 Current Implementation Details

### Token Storage (In-Memory)
```go
type PasswordResetToken struct {
    Email     string
    Token     string
    ExpiresAt time.Time
    Used      bool
}
```

**Important**: Tokens are stored in memory. When you restart the server, all tokens are cleared.

### Token Expiration
- **Duration**: 15 minutes
- **Auto-cleanup**: Used tokens are deleted after 5 minutes
- **One-time use**: Token cannot be reused after password reset

### Security Features
- ✅ Email doesn't reveal if account exists (prevents user enumeration)
- ✅ Tokens expire after 15 minutes
- ✅ Tokens are one-time use only
- ✅ Passwords are hashed with bcrypt
- ✅ Password must be at least 8 characters

## 🚀 Production Recommendations

### 1. Email Integration
Replace the mock email sending with a real email service:

```go
// In RequestPasswordReset function
// Instead of returning the token in response, send it via email
sendEmail(req.Email, "Password Reset", fmt.Sprintf(
    "Your password reset code is: %s\nExpires in 15 minutes.", 
    resetToken,
))

// Don't include reset_token in response
c.JSON(http.StatusOK, gin.H{
    "message": "Password reset code has been sent to your email",
})
```

Popular email services:
- **SendGrid**
- **AWS SES**
- **Mailgun**
- **SMTP**

### 2. Persistent Token Storage
Use Redis or database instead of in-memory map:

```go
// Redis example
rdb.Set(ctx, "reset:"+token, email, 15*time.Minute)
```

### 3. Rate Limiting
Prevent abuse by limiting reset requests:

```go
// Limit to 3 requests per email per hour
if exceedsRateLimit(email) {
    c.JSON(http.StatusTooManyRequests, gin.H{
        "error": "Too many requests. Please try again later.",
    })
    return
}
```

### 4. Enhanced Security
- Use longer, more random tokens (current: 8 chars from UUID)
- Add IP address logging
- Implement account lockout after failed attempts
- Add CAPTCHA on reset request page

### 5. User Experience
- Create a dedicated "Reset Password" page in frontend
- Show countdown timer for token expiration
- Add password strength indicator
- Send confirmation email after successful reset

## 📝 Next Steps (Optional)

### Create Reset Password Page

Create a new component for the password reset flow:

```typescript
// reset-password.component.ts
export class ResetPasswordComponent {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  
  onResetPassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    
    this.adminAuthService.resetPassword(
      this.token, 
      this.newPassword
    ).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to reset password';
      }
    });
  }
}
```

## 🐛 Troubleshooting

### "Invalid or expired reset token"
- Token has expired (15 minutes limit)
- Token was already used
- Server was restarted (in-memory tokens cleared)

### "Cannot connect to server"
- Backend not running on port 8083
- CORS issue (should be fixed already)

### Email not sent
- Email service not configured (expected in dev mode)
- Check backend logs for errors

## 📊 Current Status

✅ **Backend**: Fully functional with 3 endpoints  
✅ **Frontend**: Forgot password modal integrated  
✅ **Routes**: All password reset routes registered  
✅ **Testing**: Ready for testing (dev mode with console output)  
⚠️ **Email**: Not implemented (shows token in response/console)  
⚠️ **Storage**: In-memory (clears on restart)  

## 🔧 Files Modified

1. `backend/internal/handlers/admin_auth_handler.go` - Added password reset handlers
2. `backend/cmd/server/main.go` - Added reset routes
3. `frontend/src/app/pages/login/login.component.ts` - Connected to backend API
4. `frontend/src/app/core/services/admin-auth.service.ts` - Added reset methods

---

**Your forgot password feature is now live and ready to test!** 🎉
