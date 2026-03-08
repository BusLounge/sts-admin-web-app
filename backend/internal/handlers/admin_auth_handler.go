package handlers

import (
	"net/http"
	"sts-backend/internal/config"
	"sts-backend/internal/services"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Global email service
var emailService *services.EmailService
var appConfig *config.Config

// InitAuthHandlers initializes the auth handlers with required services
func InitAuthHandlers(cfg *config.Config) {
	appConfig = cfg
	emailService = services.NewEmailService(cfg)
}

// Hardcoded admin credentials (in production, use environment variables or secure config)
var predefinedAdmins = map[string]Admin{
	"admin@sts.lk": {
		ID:       uuid.New().String(),
		Email:    "admin@sts.lk",
		Password: "$2a$10$5zPnr8dcXUnLQvrIkjLZMu/V5Xo8A61taTOYyAFjF565SRBhmQXWK", // "admin123"
		FullName: "System Administrator",
		IsActive: true,
	},
	"superadmin@sts.lk": {
		ID:       uuid.New().String(),
		Email:    "superadmin@sts.lk",
		Password: "$2a$10$5zPnr8dcXUnLQvrIkjLZMu/V5Xo8A61taTOYyAFjF565SRBhmQXWK", // "admin123"
		FullName: "Super Administrator",
		IsActive: true,
	},
}

type Admin struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"` // Never send password in response
	FullName  string    `json:"full_name"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresIn    int       `json:"expires_in"`
	AdminUser    AdminUser `json:"admin_user"`
}

type AdminUser struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	FullName    string    `json:"full_name"`
	IsActive    bool      `json:"is_active"`
	LastLoginAt time.Time `json:"last_login_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// JWT Secret - In production, use environment variable
var jwtSecret = []byte("your-secret-key-change-in-production")

// Password reset token storage (in-memory - in production use Redis or database)
type PasswordResetToken struct {
	Email     string
	Token     string
	ExpiresAt time.Time
	Used      bool
}

var passwordResetTokens = make(map[string]*PasswordResetToken)

// AdminLogin handles admin login with predefined credentials
func AdminLogin(c *gin.Context) {
	var req LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Find admin by email
	admin, exists := predefinedAdmins[req.Email]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	// Check if admin is active
	if !admin.IsActive {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Account is inactive",
		})
		return
	}

	// Verify password
	err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	// Generate tokens
	accessToken, err := generateAccessToken(admin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate access token",
		})
		return
	}

	refreshToken, err := generateRefreshToken(admin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate refresh token",
		})
		return
	}

	// Prepare response
	response := LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    3600, // 1 hour
		AdminUser: AdminUser{
			ID:          admin.ID,
			Email:       admin.Email,
			FullName:    admin.FullName,
			IsActive:    admin.IsActive,
			LastLoginAt: time.Now(),
			CreatedAt:   time.Now().AddDate(0, -1, 0), // Mock created date
			UpdatedAt:   time.Now(),
		},
	}

	c.JSON(http.StatusOK, response)
}

// generateAccessToken creates a JWT access token
func generateAccessToken(admin Admin) (string, error) {
	claims := jwt.MapClaims{
		"admin_id":  admin.ID,
		"email":     admin.Email,
		"full_name": admin.FullName,
		"exp":       time.Now().Add(time.Hour * 1).Unix(), // 1 hour expiration
		"iat":       time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// generateRefreshToken creates a JWT refresh token
func generateRefreshToken(admin Admin) (string, error) {
	claims := jwt.MapClaims{
		"admin_id": admin.ID,
		"email":    admin.Email,
		"exp":      time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days expiration
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// AdminLogout handles admin logout
func AdminLogout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// AdminProfile returns the current admin's profile
func AdminProfile(c *gin.Context) {
	// In a real application, you'd extract this from the JWT token
	// For now, return a mock response
	c.JSON(http.StatusOK, gin.H{
		"id":        uuid.New().String(),
		"email":     "admin@sts.lk",
		"full_name": "System Administrator",
		"is_active": true,
	})
}

// RefreshAccessToken refreshes the access token using refresh token
func RefreshAccessToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Verify refresh token
	token, err := jwt.Parse(req.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid refresh token",
		})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid token claims",
		})
		return
	}

	email, _ := claims["email"].(string)
	admin, exists := predefinedAdmins[email]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Admin not found",
		})
		return
	}

	// Generate new access token
	accessToken, err := generateAccessToken(admin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate access token",
		})
		return
	}

	response := LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: req.RefreshToken,
		ExpiresIn:    3600,
		AdminUser: AdminUser{
			ID:          admin.ID,
			Email:       admin.Email,
			FullName:    admin.FullName,
			IsActive:    admin.IsActive,
			LastLoginAt: time.Now(),
			CreatedAt:   time.Now().AddDate(0, -1, 0),
			UpdatedAt:   time.Now(),
		},
	}

	c.JSON(http.StatusOK, response)
}

// RequestPasswordReset initiates password reset process
func RequestPasswordReset(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid email format",
		})
		return
	}

	// Check if admin exists
	admin, exists := predefinedAdmins[req.Email]
	if !exists {
		// Don't reveal if email exists or not (security best practice)
		c.JSON(http.StatusOK, gin.H{
			"message": "If the email exists, a password reset link has been sent",
		})
		return
	}

	// Check if admin is active
	if !admin.IsActive {
		c.JSON(http.StatusOK, gin.H{
			"message": "If the email exists, a password reset link has been sent",
		})
		return
	}

	// Generate reset token (6-digit code for simplicity)
	resetToken := generateResetToken()

	// Store reset token (expires in 15 minutes)
	passwordResetTokens[resetToken] = &PasswordResetToken{
		Email:     req.Email,
		Token:     resetToken,
		ExpiresAt: time.Now().Add(15 * time.Minute),
		Used:      false,
	}

	// Send password reset email
	if emailService != nil {
		err := emailService.SendPasswordResetEmail(req.Email, resetToken)
		if err != nil {
			// Log error but don't reveal to user
			println("Error sending email:", err.Error())
			c.JSON(http.StatusOK, gin.H{
				"message": "If the email exists, a password reset link has been sent",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset code has been sent to your email. Please check your inbox.",
	})
}

// VerifyResetToken verifies if a reset token is valid
func VerifyResetToken(c *gin.Context) {
	var req struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	resetToken, exists := passwordResetTokens[req.Token]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid or expired reset token",
		})
		return
	}

	// Check if token is expired
	if time.Now().After(resetToken.ExpiresAt) {
		delete(passwordResetTokens, req.Token)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Reset token has expired",
		})
		return
	}

	// Check if token was already used
	if resetToken.Used {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Reset token has already been used",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid": true,
		"email": resetToken.Email,
	})
}

// ResetPassword resets the admin password using a valid token
func ResetPassword(c *gin.Context) {
	var req struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format. Password must be at least 8 characters",
		})
		return
	}

	resetToken, exists := passwordResetTokens[req.Token]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid or expired reset token",
		})
		return
	}

	// Check if token is expired
	if time.Now().After(resetToken.ExpiresAt) {
		delete(passwordResetTokens, req.Token)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Reset token has expired",
		})
		return
	}

	// Check if token was already used
	if resetToken.Used {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Reset token has already been used",
		})
		return
	}

	// Get admin
	admin, exists := predefinedAdmins[resetToken.Email]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Admin not found",
		})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process new password",
		})
		return
	}

	// Update password
	admin.Password = string(hashedPassword)
	admin.UpdatedAt = time.Now()
	predefinedAdmins[resetToken.Email] = admin

	// Mark token as used
	resetToken.Used = true

	// Clean up used token after a delay
	go func() {
		time.Sleep(5 * time.Minute)
		delete(passwordResetTokens, req.Token)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Password has been reset successfully",
	})
}

// generateResetToken generates a 6-digit reset code
func generateResetToken() string {
	// Generate random 6-digit code
	return uuid.New().String()[:8] // Using first 8 chars of UUID for simplicity
}
