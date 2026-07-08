package services

import (
	"database/sql"
	"fmt"
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

// RouteService handles business logic for route management
type RouteService struct {
	repo *database.RouteRepository
}

func NewRouteService(db *sql.DB) *RouteService {
	return &RouteService{repo: database.NewRouteRepository(db)}
}

func (s *RouteService) GetAllRoutes() ([]models.MasterRoute, error) {
	return s.repo.GetAll()
}

func (s *RouteService) GetRouteStops(routeID string) ([]models.RouteStop, error) {
	return s.repo.GetRouteStops(routeID)
}

func (s *RouteService) GetRouteByID(id string) (*models.MasterRoute, error) {
	route, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if route == nil {
		return nil, fmt.Errorf("route not found")
	}
	return route, nil
}

func (s *RouteService) CreateRoute(req *models.CreateRouteRequest) (*models.MasterRoute, error) {
	if req.EncodedPolyline == "" {
		return nil, fmt.Errorf("encoded_polyline is required")
	}
	if req.RouteName == "" {
		return nil, fmt.Errorf("route_name is required")
	}
	return s.repo.Create(req)
}

func (s *RouteService) UpdateRoute(id string, req *models.UpdateRouteRequest) (*models.MasterRoute, error) {
	route, err := s.repo.Update(id, req)
	if err != nil {
		return nil, err
	}
	if route == nil {
		return nil, fmt.Errorf("route not found")
	}
	return route, nil
}

func (s *RouteService) DeleteRoute(id string) error {
	return s.repo.Delete(id)
}
