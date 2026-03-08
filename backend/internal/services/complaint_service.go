package services

import (
	"database/sql"
	"fmt"
	"strings"
	"sts-backend/internal/config"
	"sts-backend/internal/database"
	"sts-backend/internal/models"
	"time"
)

var (
	escalationServiceInstance *EscalationService
	db                        *sql.DB
)

// InitComplaintService initializes the complaint service with escalation support
func InitComplaintService(database *sql.DB, cfg *config.Config) {
	db = database
	escalationServiceInstance = NewEscalationService(database, cfg)
}

func GetComplaintsByRole(role string) ([]models.ComplaintResponse, error) {
	complaints, err := database.GetComplaintsByRole(role)
	if err != nil {
		return nil, err
	}
	return transformComplaints(complaints), nil
}

func GetAllComplaints() ([]models.ComplaintResponse, error) {
	complaints, err := database.GetAllComplaints()
	if err != nil {
		return nil, err
	}
	return transformComplaints(complaints), nil
}

func GetComplaintByID(id string) (*models.ComplaintResponse, error) {
	complaint, err := database.GetComplaintByID(id)
	if err != nil {
		return nil, err
	}
	if complaint == nil {
		return nil, nil
	}
	
	response := transformComplaint(*complaint)
	return &response, nil
}

func UpdateComplaintStatus(id string, status string, resolvedByID *string, resolutionNotes *string) error {
	return database.UpdateComplaintStatus(id, status, resolvedByID, resolutionNotes)
}

// Helper function to transform complaints to response format
func transformComplaints(complaints []models.Complaint) []models.ComplaintResponse {
	responses := make([]models.ComplaintResponse, 0, len(complaints))
	for _, c := range complaints {
		responses = append(responses, transformComplaint(c))
	}
	return responses
}

func transformComplaint(c models.Complaint) models.ComplaintResponse {
	category := formatCategory(c.IssueType)
	
	// Get or initialize escalation
	var escalation *models.ComplaintEscalation
	if escalationServiceInstance != nil {
		escalation, _ = escalationServiceInstance.GetComplaintEscalation(c.ID)
		
		// Auto-initialize escalation if not exists and complaint is not resolved/closed
		if escalation == nil && c.Status != "resolved" && c.Status != "closed" {
			err := escalationServiceInstance.InitializeEscalation(c.ID, category)
			if err == nil {
				escalation, _ = escalationServiceInstance.GetComplaintEscalation(c.ID)
			}
		}
	}
	
	// Get assigned team from escalation or fallback to mapping
	assignedTeam := getAssignedTeamFromEscalation(escalation, category, c.IssueType)
	
	response := models.ComplaintResponse{
		ID:              c.ID,
		Role:            capitalizeRole(c.ReporterRole),
		Name:            c.ReporterName,
		Contact:         c.ReporterPhone,
		Category:        category,
		Message:         c.Description,
		Media:           getMediaDisplay(c.ImageURL),
		DateTime:        formatDateTime(c.CreatedAt),
		AssignedTeam:    assignedTeam,
		ResolvedBy:      getResolverName(c.ResolverName),
		Activity:        formatActivity(c.ResolutionNotes),
		Status:          formatStatus(c.Status),
		Priority:        c.Priority,
		Latitude:        c.Latitude,
		Longitude:       c.Longitude,
		LocationAddress: c.LocationAddress,
		Escalation:      escalation,
	}
	return response
}

func capitalizeRole(role string) string {
	switch role {
	case "driver":
		return "Driver"
	case "conductor":
		return "Conductor"
	case "passenger":
		return "Passenger"
	case "bus_owner":
		return "Bus Owner"
	case "lounge_owner":
		return "Lounge Owner"
	default:
		return role
	}
}

func formatCategory(issueType string) string {
	// Use consistent category mapping
	return MapIssuetypeToCategory(issueType)
}

func getMediaDisplay(imageURL *string) string {
	if imageURL != nil && *imageURL != "" {
		return "Image"
	}
	return "Empty"
}

func formatDateTime(dateTime string) string {
	t, err := time.Parse(time.RFC3339, dateTime)
	if err != nil {
		return dateTime
	}
	return t.Format("2006-01-02 15:04")
}

// getAssignedTeamFromEscalation gets the team from escalation or uses category-based assignment
func getAssignedTeamFromEscalation(escalation *models.ComplaintEscalation, category string, issueType string) string {
	if escalation != nil && escalation.CurrentTeam != "" {
		return escalation.CurrentTeam
	}
	
	// Get team from escalation config (Level 1 by default)
	assignment := config.GetAssignmentForCategory(category, 1)
	if assignment != nil {
		return assignment.TeamName
	}
	
	// Fallback to old mapping if config not found
	switch issueType {
	case "bus_delay":
		return "Operations Team"
	case "maintenance_issue", "flat_wheel", "equipment_malfunction":
		return "Maintenance Team"
	case "passenger_complaint":
		return "Customer Service"
	case "safety_concern":
		return "Safety & Security"
	default:
		return "General Support"
	}
}

func getResolverName(resolverName *string) string {
	if resolverName != nil && *resolverName != "" {
		return *resolverName
	}
	return ""
}

func formatActivity(resolutionNotes *string) string {
	if resolutionNotes != nil && *resolutionNotes != "" {
		return fmt.Sprintf("\"%s\"", *resolutionNotes)
	}
	return ""
}

func formatStatus(status string) string {
	switch status {
	case "reported":
		return "Pending"
	case "in_progress":
		return "In progress"
	case "resolved":
		return "Resolved"
	case "acknowledged":
		return "Acknowledged"
	case "closed":
		return "Closed"
	default:
		return status
	}
}

// MapIssuetypeToCategory maps issue_type to escalation category
func MapIssuetypeToCategory(issueType string) string {
	switch issueType {
	case "bus_delay":
		return "Operations & Scheduling"
	case "maintenance_issue", "flat_wheel", "equipment_malfunction":
		return "Vehicle & Facility"
	case "passenger_complaint":
		return "Service Issue"
	case "safety_concern":
		return "Safety & Security"
	default:
		// Try to format unknown types nicely
		if issueType != "" {
			return strings.Title(strings.ReplaceAll(issueType, "_", " "))
		}
		return "Other"
	}
}
