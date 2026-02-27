package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

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
