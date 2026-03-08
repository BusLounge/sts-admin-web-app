package services

import (
	"database/sql"
	"fmt"
	"log"
	"sync"
	"time"

	"sts-backend/internal/config"
	"sts-backend/internal/models"
)

// EscalationState stores the current escalation state for a complaint (in-memory)
type EscalationState struct {
	ComplaintID       string
	CurrentLevel      int
	CurrentTeam       string
	LastEscalatedAt   time.Time
	NextEscalationDue time.Time
	LastNotifiedLevel int
	Category          string
}

type EscalationService struct {
	db         *sql.DB
	smsService *SMSService
	// In-memory storage for escalation states
	escalations sync.Map // map[complaintID]EscalationState
}

func NewEscalationService(db *sql.DB, cfg *config.Config) *EscalationService {
	return &EscalationService{
		db:          db,
		smsService:  NewSMSService(cfg),
		escalations: sync.Map{},
	}
}

// InitializeEscalation sets up escalation tracking for a new complaint (in-memory)
func (s *EscalationService) InitializeEscalation(complaintID, category string) error {
	escalationConfig := models.GetEscalationConfigForCategory(category)
	if escalationConfig == nil {
		return fmt.Errorf("no escalation config found for category: %s", category)
	}

	if len(escalationConfig.Levels) == 0 {
		return fmt.Errorf("no escalation levels defined for category: %s", category)
	}

	// Start at level 1
	firstLevel := escalationConfig.Levels[0]
	nextEscalationDue := time.Now().AddDate(0, 0, firstLevel.EscalationDays)

	// Store in memory
	state := EscalationState{
		ComplaintID:       complaintID,
		CurrentLevel:      firstLevel.Level,
		CurrentTeam:       firstLevel.TeamName,
		LastEscalatedAt:   time.Now(),
		NextEscalationDue: nextEscalationDue,
		LastNotifiedLevel: 0,
		Category:          category,
	}
	s.escalations.Store(complaintID, state)

	log.Printf("📋 Initialized escalation for complaint %s at Level %d (%s)",
		complaintID, firstLevel.Level, firstLevel.TeamName)

	// Send SMS notification to assigned team
	assignment := config.GetAssignmentForCategory(category, firstLevel.Level)
	if assignment != nil {
		err := s.smsService.SendNewComplaintNotification(
			assignment.PhoneNumber,
			assignment.RoleName,
			complaintID,
			category,
		)
		if err != nil {
			log.Printf("Failed to send SMS notification: %v", err)
		} else {
			state.LastNotifiedLevel = firstLevel.Level
			s.escalations.Store(complaintID, state)
		}
	}

	return nil
}

// CheckAndEscalateComplaints finds complaints that need escalation and escalates them (in-memory)
func (s *EscalationService) CheckAndEscalateComplaints() (int, error) {
	// Get all pending/in-progress complaints from the database
	query := `
		SELECT id, issue_type, created_at, status
		FROM report_issues
		WHERE status NOT IN ('resolved', 'closed')
		ORDER BY created_at ASC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return 0, fmt.Errorf("failed to query complaints: %w", err)
	}
	defer rows.Close()

	escalatedCount := 0
	now := time.Now()

	for rows.Next() {
		var complaintID, issueType, status string
		var createdAt time.Time

		if err := rows.Scan(&complaintID, &issueType, &createdAt, &status); err != nil {
			log.Printf("Error scanning complaint row: %v", err)
			continue
		}

		// Map issue_type to category
		category := MapIssuetypeToCategory(issueType)

		// Get or create escalation state
		stateVal, exists := s.escalations.Load(complaintID)
		if !exists {
			// Auto-initialize escalation for this complaint
			err := s.InitializeEscalation(complaintID, category)
			if err != nil {
				log.Printf("Failed to initialize escalation for %s: %v", complaintID, err)
				continue
			}
			stateVal, exists = s.escalations.Load(complaintID)
			if !exists {
				continue
			}
		}

		state := stateVal.(EscalationState)

		// Check if escalation is due
		if now.After(state.NextEscalationDue) {
			// Escalate to next level
			if err := s.EscalateToNextLevel(complaintID, category, state.CurrentLevel, "auto"); err != nil {
				log.Printf("Failed to escalate complaint %s: %v", complaintID, err)
				continue
			}
			escalatedCount++
		}
	}

	return escalatedCount, nil
}

// EscalateToNextLevel escalates a complaint to the next level (in-memory)
func (s *EscalationService) EscalateToNextLevel(complaintID, category string, currentLevel int, escalatedBy string) error {
	escalationConfig := models.GetEscalationConfigForCategory(category)
	if escalationConfig == nil {
		return fmt.Errorf("no escalation config found for category: %s", category)
	}

	// Find next level
	var nextLevel *models.EscalationLevel
	for i, level := range escalationConfig.Levels {
		if level.Level == currentLevel+1 {
			nextLevel = &escalationConfig.Levels[i]
			break
		}
	}

	if nextLevel == nil {
		// Already at highest level
		log.Printf("Complaint %s is already at highest escalation level %d for category %s",
			complaintID, currentLevel, category)
		return nil
	}

	// Calculate next escalation due date
	nextEscalationDue := time.Now().AddDate(0, 0, nextLevel.EscalationDays)

	// Update in-memory state
	state := EscalationState{
		ComplaintID:       complaintID,
		CurrentLevel:      nextLevel.Level,
		CurrentTeam:       nextLevel.TeamName,
		LastEscalatedAt:   time.Now(),
		NextEscalationDue: nextEscalationDue,
		LastNotifiedLevel: 0,
		Category:          category,
	}
	s.escalations.Store(complaintID, state)

	log.Printf("⬆️ Escalated complaint %s to level %d (%s)", complaintID, nextLevel.Level, nextLevel.TeamName)

	// Send SMS notification to assigned team
	assignment := config.GetAssignmentForCategory(category, nextLevel.Level)
	if assignment != nil {
		err := s.smsService.SendEscalationNotification(
			assignment.PhoneNumber,
			assignment.RoleName,
			complaintID,
			category,
			nextLevel.Level,
		)
		if err != nil {
			log.Printf("Failed to send escalation SMS notification: %v", err)
		} else {
			state.LastNotifiedLevel = nextLevel.Level
			s.escalations.Store(complaintID, state)
			log.Printf("📱 Sent escalation SMS to %s (%s)", assignment.RoleName, assignment.PhoneNumber)
		}
	}

	return nil
}

// GetComplaintEscalation retrieves escalation info for a complaint (from memory)
func (s *EscalationService) GetComplaintEscalation(complaintID string) (*models.ComplaintEscalation, error) {
	stateVal, exists := s.escalations.Load(complaintID)
	if !exists {
		return nil, nil // No escalation record yet
	}

	state := stateVal.(EscalationState)

	escalation := &models.ComplaintEscalation{
		CurrentLevel:      state.CurrentLevel,
		CurrentTeam:       state.CurrentTeam,
		LastEscalatedAt:   &state.LastEscalatedAt,
		NextEscalationDue: &state.NextEscalationDue,
	}

	return escalation, nil
}

// GetEscalationHistory retrieves the escalation history for a complaint (from memory)
func (s *EscalationService) GetEscalationHistory(complaintID string) ([]models.EscalationHistoryEntry, error) {
	// Since we're not persisting history, return empty for now
	// In a real system, you might want to log this to a file or separate storage
	var history []models.EscalationHistoryEntry

	stateVal, exists := s.escalations.Load(complaintID)
	if exists {
		state := stateVal.(EscalationState)
		// Create a single entry showing current state
		history = append(history, models.EscalationHistoryEntry{
			Level:       state.CurrentLevel,
			TeamName:    state.CurrentTeam,
			EscalatedAt: state.LastEscalatedAt,
			EscalatedBy: "system",
			Reason:      fmt.Sprintf("Currently at level %d", state.CurrentLevel),
		})
	}

	return history, nil
}

// AssignComplaintToAdmin assigns a complaint to a specific admin (in memory)
func (s *EscalationService) AssignComplaintToAdmin(complaintID, adminID string) error {
	stateVal, exists := s.escalations.Load(complaintID)
	if !exists {
		return fmt.Errorf("complaint escalation record not found")
	}

	state := stateVal.(EscalationState)
	// Note: We don't have an AdminID field in our EscalationState,
	// but we can log this action
	log.Printf("Assigned complaint %s to admin %s (Level %d)", complaintID, adminID, state.CurrentLevel)

	return nil
}

// GetEscalationStats returns escalation statistics (from memory)
func (s *EscalationService) GetEscalationStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	levelCounts := make(map[int]int)
	overdueCount := 0
	now := time.Now()

	// Iterate through all escalations in memory
	s.escalations.Range(func(key, value interface{}) bool {
		state := value.(EscalationState)

		// Count by level
		levelCounts[state.CurrentLevel]++

		// Check if overdue
		if now.After(state.NextEscalationDue) {
			overdueCount++
		}

		return true
	})

	stats["by_level"] = levelCounts
	stats["overdue_count"] = overdueCount
	stats["total_tracked"] = len(levelCounts)

	return stats, nil
}
