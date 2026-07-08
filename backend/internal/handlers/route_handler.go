package handlers

import (
	"database/sql"
	"net/http"
	"sts-backend/internal/models"
	"sts-backend/internal/services"

	"github.com/gin-gonic/gin"
)

// RouteHandler handles HTTP requests for route management
type RouteHandler struct {
	svc *services.RouteService
}

func NewRouteHandler(db *sql.DB) *RouteHandler {
	return &RouteHandler{svc: services.NewRouteService(db)}
}

// GetRoutes godoc GET /api/routes
func (h *RouteHandler) GetRoutes(c *gin.Context) {
	routes, err := h.svc.GetAllRoutes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, routes)
}

// GetRoute godoc GET /api/routes/:id
func (h *RouteHandler) GetRoute(c *gin.Context) {
	id := c.Param("id")
	route, err := h.svc.GetRouteByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, route)
}

// GetRouteStops godoc GET /api/routes/:id/stops
func (h *RouteHandler) GetRouteStops(c *gin.Context) {
	id := c.Param("id")
	stops, err := h.svc.GetRouteStops(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stops)
}

// CreateRoute godoc POST /api/routes
func (h *RouteHandler) CreateRoute(c *gin.Context) {
	var req models.CreateRouteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	route, err := h.svc.CreateRoute(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, route)
}

// UpdateRoute godoc PUT /api/routes/:id
func (h *RouteHandler) UpdateRoute(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdateRouteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	route, err := h.svc.UpdateRoute(id, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, route)
}

// DeleteRoute godoc DELETE /api/routes/:id
func (h *RouteHandler) DeleteRoute(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeleteRoute(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Route deleted successfully"})
}
