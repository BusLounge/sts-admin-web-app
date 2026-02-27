package main

import (
	"log"
	"sts-backend/internal/config"
	"sts-backend/internal/database"
	"sts-backend/internal/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()
	database.Init(cfg)

	// Test Database connection
	err := database.DB.Ping()
	if err != nil {
		log.Printf("Database Connection Check: %v", err)
	} else {
		log.Println("Database Connection Check: Successfully connected!")
	}

	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Basic health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// API Routes
	api := r.Group("/api")
	{
		// Admin authentication routes
		adminAuth := api.Group("/admin/auth")
		{
			adminAuth.POST("/login", handlers.AdminLogin)
			adminAuth.POST("/logout", handlers.AdminLogout)
			adminAuth.POST("/refresh", handlers.RefreshAccessToken)
			adminAuth.GET("/profile", handlers.AdminProfile)
		}

		// Lounge routes
		api.GET("/lounges", handlers.GetLounges)
		api.GET("/lounges/pending", handlers.GetPendingLounges)
		api.GET("/lounges/:id", handlers.GetLoungeById)
		api.POST("/lounges", handlers.CreateLounge)
		api.PUT("/lounges/:id", handlers.UpdateLounge)
		api.PUT("/lounges/:id/verify", handlers.VerifyLounge)
		api.DELETE("/lounges/:id", handlers.DeleteLounge)

		// Bus routes
		api.GET("/buses", handlers.GetBuses)
		api.GET("/buses/pending", handlers.GetPendingBuses)
		api.GET("/buses/:id", handlers.GetBusById)
		api.POST("/buses", handlers.CreateBus)
		api.PUT("/buses/:id", handlers.UpdateBus)
		api.PUT("/buses/:id/verify", handlers.VerifyBus)

		// Bus Owner routes
		api.GET("/bus-owners", handlers.GetBusOwners)
		api.GET("/bus-owners/pending", handlers.GetPendingBusOwners)
		api.GET("/bus-owners/:id", handlers.GetBusOwnerById)
		api.POST("/bus-owners", handlers.CreateBusOwner)
		api.PUT("/bus-owners/:id", handlers.UpdateBusOwner)
		api.PUT("/bus-owners/:id/verify", handlers.VerifyBusOwner)
		api.DELETE("/bus-owners/:id", handlers.DeleteBusOwner)

		// Driver routes
		api.GET("/drivers", handlers.GetDrivers)
		api.GET("/drivers/pending", handlers.GetPendingDrivers)
		api.GET("/drivers/:id", handlers.GetDriverById)
		api.POST("/drivers", handlers.CreateDriver)
		api.PUT("/drivers/:id", handlers.UpdateDriver)
		api.PUT("/drivers/:id/verify", handlers.VerifyDriver)

		// Conductor routes
		api.GET("/conductors", handlers.GetConductors)
		api.GET("/conductors/pending", handlers.GetPendingConductors)
		api.GET("/conductors/:id", handlers.GetConductorById)
		api.POST("/conductors", handlers.CreateConductor)
		api.PUT("/conductors/:id", handlers.UpdateConductor)
		api.PUT("/conductors/:id/verify", handlers.VerifyConductor)

		// Booking routes
		api.GET("/bookings", handlers.GetBookings)
		api.GET("/bookings/status", handlers.GetBookingsByStatus)
		api.GET("/bookings/search", handlers.SearchBookings)
		api.POST("/bookings", handlers.CreateBooking)
		api.GET("/bookings/:id", handlers.GetBookingByID)
		api.PUT("/bookings/:id", handlers.UpdateBooking)
		api.PUT("/bookings/:id/status", handlers.UpdateBookingStatus)
		api.PUT("/bookings/:id/payment", handlers.UpdatePaymentStatus)
		api.DELETE("/bookings/:id", handlers.CancelBooking)

		// Lounge Booking routes
		api.GET("/lounge-bookings", handlers.GetLoungeBookings)
		api.GET("/lounge-bookings/:id", handlers.GetLoungeBookingByID)
		api.POST("/lounge-bookings", handlers.CreateLoungeBooking)
		api.PUT("/lounge-bookings/:id", handlers.UpdateLoungeBooking)
		api.PATCH("/lounge-bookings/:id/payment-status", handlers.UpdateLoungeBookingPaymentStatus)
		api.PATCH("/lounge-bookings/:id/booking-status", handlers.UpdateLoungeBookingStatus)
		api.DELETE("/lounge-bookings/:id", handlers.DeleteLoungeBooking)
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
