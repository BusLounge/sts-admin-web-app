package services

import (
	"fmt"
	"log"
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetPendingLoungeOwners() ([]models.LoungeOwner, error) {
	return database.GetPendingLoungeOwners()
}

func GetLoungeOwnerByID(id string) (*models.LoungeOwner, error) {
	return database.GetLoungeOwnerByID(id)
}

func VerifyLoungeOwner(id string, status string, notes string) error {
	if err := database.VerifyLoungeOwner(id, status, notes); err != nil {
		return err
	}

	if isApprovedStatus(status) {
		owner, err := database.GetLoungeOwnerByID(id)
		if err != nil {
			log.Printf("failed to load lounge owner %s after approval: %v", id, err)
			return nil
		}
		if owner != nil {
			notifyApprovalDecision(
				owner.ContactNumber,
				"lounge owner",
				"approved",
				formatDecisionDetail("Name", owner.ManagerFullName),
				formatDecisionDetail("Email", owner.Email),
			)
		}
	}

	return nil
}

func ProcessLoungeOwnerWebhook(owner models.LoungeOwner) error {
	if isPendingApprovalStatus(owner.VerificationStatus) {
		notifyApprovalRequest(
			"lounge owner",
			fmt.Sprintf("Name: %s", owner.ManagerFullName),
			fmt.Sprintf("Email: %s", owner.Email),
			fmt.Sprintf("Contact: %s", owner.ContactNumber),
			fmt.Sprintf("NIC: %s", owner.NIC),
		)
		
		// Notify the requester that their request was received
		notifyApprovalDecision(
			owner.ContactNumber,
			"lounge owner",
			"received and is currently pending approval",
		)
	} else if isApprovedStatus(owner.VerificationStatus) {
		// Send SMS to requester when they are approved
		notifyApprovalDecision(
			owner.ContactNumber,
			"lounge owner",
			"approved",
			formatDecisionDetail("Name", owner.ManagerFullName),
			formatDecisionDetail("Email", owner.Email),
		)
	}
	return nil
}

func CreateLoungeOwner(owner *models.LoungeOwner) error {
	owner.VerificationStatus = ensurePendingApprovalStatus(owner.VerificationStatus)

	if err := database.CreateLoungeOwner(owner); err != nil {
		return err
	}

	if isPendingApprovalStatus(owner.VerificationStatus) {
		notifyApprovalRequest(
			"lounge owner",
			fmt.Sprintf("Name: %s", owner.ManagerFullName),
			fmt.Sprintf("Email: %s", owner.Email),
			fmt.Sprintf("Contact: %s", owner.ContactNumber),
			fmt.Sprintf("NIC: %s", owner.NIC),
		)
	}

	return nil
}
