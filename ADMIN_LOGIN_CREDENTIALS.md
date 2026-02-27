# Admin Login Credentials

## Overview
This document contains the predefined admin credentials for the STS Admin Dashboard. The authentication is implemented without database dependency using hardcoded credentials.

## Available Admin Accounts

### Account 1: System Administrator
- **Email:** `admin@sts.lk`
- **Password:** `admin123`
- **Role:** System Administrator

### Account 2: Super Administrator  
- **Email:** `superadmin@sts.lk`
- **Password:** `admin123`
- **Role:** Super Administrator

## Accessing the Dashboard

1. **Start the Backend Server:**
   ```bash
   cd backend
   go run cmd/server/main.go
   ```
   Backend will run on: `http://localhost:8083`

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on: `http://localhost:4200`

3. **Login:**
   - Navigate to `http://localhost:4200`
   - Click on "Admin Login" or navigate to the login page
   - Enter one of the credentials above
   - Click "Login"

## API Endpoints

### Authentication Endpoints

#### Login
- **URL:** `POST /api/admin/auth/login`
- **Body:**
  ```json
  {
    "email": "admin@sts.lk",
    "password": "admin123"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 3600,
    "admin_user": {
      "id": "uuid",
      "email": "admin@sts.lk",
      "full_name": "System Administrator",
      "is_active": true,
      "last_login_at": "2026-02-27T10:30:00Z",
      "created_at": "2026-01-27T10:30:00Z",
      "updated_at": "2026-02-27T10:30:00Z"
    }
  }
  ```

#### Logout
- **URL:** `POST /api/admin/auth/logout`
- **Headers:** `Authorization: Bearer <access_token>`

#### Refresh Token
- **URL:** `POST /api/admin/auth/refresh`
- **Body:**
  ```json
  {
    "refresh_token": "your-refresh-token"
  }
  ```

#### Get Profile
- **URL:** `GET /api/admin/auth/profile`
- **Headers:** `Authorization: Bearer <access_token>`

## Token Information

- **Access Token Expiry:** 1 hour
- **Refresh Token Expiry:** 7 days
- **Token Type:** JWT (JSON Web Token)
- **Signing Method:** HS256

## Security Notes

### For Development
- The current implementation uses hardcoded credentials suitable for development
- JWT secret is embedded in code (change for production)
- No database dependency for authentication

### For Production (Recommendations)
1. **Move credentials to environment variables:**
   ```env
   ADMIN_EMAIL=admin@sts.lk
   ADMIN_PASSWORD_HASH=<bcrypt-hash>
   ```

2. **Use secure JWT secret:**
   ```env
   JWT_SECRET=<strong-random-secret>
   ```

3. **Enable HTTPS** for all communications

4. **Implement rate limiting** for login attempts

5. **Add logging** for authentication events

6. **Consider database storage** for admin accounts with proper security

## Changing Passwords

To generate a new password hash (if you want to change credentials):

```go
package main

import (
    "fmt"
    "golang.org/x/crypto/bcrypt"
)

func main() {
    password := "your-new-password"
    hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    fmt.Println(string(hash))
}
```

Then update the `predefinedAdmins` map in `backend/internal/handlers/admin_auth_handler.go`

## Adding New Admin Accounts

Edit the `predefinedAdmins` map in `backend/internal/handlers/admin_auth_handler.go`:

```go
var predefinedAdmins = map[string]Admin{
    "admin@sts.lk": {
        ID:       uuid.New().String(),
        Email:    "admin@sts.lk",
        Password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        FullName: "System Administrator",
        IsActive: true,
    },
    "newadmin@sts.lk": {  // Add new account here
        ID:       uuid.New().String(),
        Email:    "newadmin@sts.lk",
        Password: "<bcrypt-hash-of-password>",
        FullName: "New Administrator",
        IsActive: true,
    },
}
```

## Troubleshooting

### Cannot Connect to Server
- Ensure backend is running on port 8083
- Check CORS settings in backend

### Invalid Credentials
- Verify email and password match exactly
- Ensure account `is_active` is set to `true`

### Token Expired
- Use the refresh token endpoint to get a new access token
- Login again if refresh token has expired

## Current Status

✅ Backend server running on: http://localhost:8083  
✅ Frontend running on: http://localhost:4200  
✅ Admin authentication endpoint: http://localhost:8083/api/admin/auth/login  
✅ Predefined credentials active and ready to use
