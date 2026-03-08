package main

import (
	"log"
	"time"
	"sts-backend/internal/config"
	"sts-backend/internal/database"
	"sts-backend/internal/handlers"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()
	database.Init(cfg)

	// Initialize auth handlers with email service
	handlers.InitAuthHandlers(cfg)
	
	// Initialize complaint service with escalation support
	services.InitComplaintService(database.DB, cfg)

	// Test Database connection
	err := database.DB.Ping()
	if err != nil {
		log.Printf("Database Connection Check: %v", err)
	} else {
		log.Println("Database Connection Check: Successfully connected!")
	}

	// Initialize escalation scheduler (runs every hour)
	escalationScheduler := services.NewEscalationScheduler(database.DB, cfg, 1*time.Hour)
	escalationScheduler.Start()
	log.Println("✅ Complaint escalation scheduler started (runs every 1 hour)")

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
			
			// Password reset routes
			adminAuth.POST("/forgot-password", handlers.RequestPasswordReset)
			adminAuth.POST("/verify-reset-token", handlers.VerifyResetToken)
			adminAuth.POST("/reset-password", handlers.ResetPassword)
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

		// Complaint routes
		api.GET("/complaints", handlers.GetComplaints)
		api.GET("/complaints/:id", handlers.GetComplaintById)
		api.PUT("/complaints/:id/status", handlers.UpdateComplaintStatus)
		api.POST("/complaints/:id/escalate", handlers.ManualEscalateComplaint)
		api.GET("/complaints/:id/escalation", handlers.GetComplaintEscalation)

		// Initialize escalation service for complaint handlers
		escalationSvc := services.NewEscalationService(database.DB, cfg)
		handlers.SetEscalationService(escalationSvc)

		// Escalation routes
		escalationHandler := handlers.NewEscalationHandler(database.DB, cfg)
		api.GET("/escalation/config", escalationHandler.GetEscalationConfig)
		api.GET("/escalation/config/:category", escalationHandler.GetEscalationConfigForCategory)
		api.GET("/escalation/complaint/:id", escalationHandler.GetComplaintEscalation)
		api.GET("/escalation/complaint/:id/history", escalationHandler.GetEscalationHistory)
		api.POST("/escalation/complaint/:id/escalate", escalationHandler.EscalateComplaint)
		api.POST("/escalation/complaint/:id/assign", escalationHandler.AssignComplaint)
		api.POST("/escalation/complaint/:id/initialize", escalationHandler.InitializeComplaintEscalation)
		api.GET("/escalation/stats", escalationHandler.GetEscalationStats)
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
