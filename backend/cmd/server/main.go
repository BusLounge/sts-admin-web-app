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
		// Lounge routes
		api.GET("/lounges", handlers.GetLounges)
		api.POST("/lounges", handlers.CreateLounge)
		api.PUT("/lounges/:id", handlers.UpdateLounge)
		api.DELETE("/lounges/:id", handlers.DeleteLounge)
		// api.GET("/lounges/pending", handlers.GetPendingLounges)
		// api.PUT("/lounges/:id/verify", handlers.VerifyLounge)

		// Bus routes
		api.GET("/buses", handlers.GetBuses)
		api.POST("/buses", handlers.CreateBus)
		api.PUT("/buses/:id", handlers.UpdateBus)
		api.GET("/buses/pending", handlers.GetPendingBuses)
		api.PUT("/buses/:id/verify", handlers.VerifyBus)

		// Driver routes
		api.GET("/drivers", handlers.GetDrivers)
		api.POST("/drivers", handlers.CreateDriver)
		api.PUT("/drivers/:id", handlers.UpdateDriver)

		// Conductor routes
		api.GET("/conductors", handlers.GetConductors)
		api.POST("/conductors", handlers.CreateConductor)
		api.PUT("/conductors/:id", handlers.UpdateConductor)
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
