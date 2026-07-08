package services

import (
	"fmt"
	"sts-backend/internal/database"
	"sts-backend/internal/models"
)

func GetDrivers() ([]models.Driver, error) {
	repo := database.NewStaffRepository(database.DB)
	return repo.GetDrivers()
}

func GetPendingDrivers() ([]models.Driver, error) {
	repo := database.NewStaffRepository(database.DB)
	return repo.GetPendingDrivers()
}

func GetDriverByID(id string) (*models.Driver, error) {
	repo := database.NewStaffRepository(database.DB)
	return repo.GetDriverByID(id)
}

func CreateDriver(driver *models.Driver) error {
	driver.VerificationStatus = ensurePendingApprovalStatus(driver.VerificationStatus)

	repo := database.NewStaffRepository(database.DB)
	if err := repo.CreateDriver(driver); err != nil {
		return err
	}

	if isPendingApprovalStatus(driver.VerificationStatus) {
		notifyApprovalRequest(
			"driver",
			fmt.Sprintf("Name: %s", driver.Name),
			fmt.Sprintf("Contact: %s", driver.ContactNumber),
			fmt.Sprintf("License number: %s", driver.LicenseNumber),
			fmt.Sprintf("Employment status: %s", driver.Status),
		)
	}

	return nil
}

func UpdateDriver(driver *models.Driver) error {
	repo := database.NewStaffRepository(database.DB)
	return repo.UpdateDriver(driver)
}

func UpdateDriverVerification(id string, status string, documents string) error {
	repo := database.NewStaffRepository(database.DB)
	if err := repo.UpdateDriverVerification(id, status, documents); err != nil {
		return err
	}

	if isApprovedStatus(status) {
		driver, err := repo.GetDriverByID(id)
		if err != nil {
			return err
		}
		if driver != nil {
			notifyApprovalDecision(
				driver.ContactNumber,
				"driver",
				"approved",
				formatDecisionDetail("Name", driver.Name),
				formatDecisionDetail("License", driver.LicenseNumber),
			)
		}
	}

	return nil
}

func ProcessBusStaffWebhook(staff map[string]interface{}) error {
	staffType, _ := staff["staff_type"].(string)
	verificationStatus, _ := staff["verification_status"].(string)
	contactNumber, _ := staff["emergency_contact"].(string)
	firstName, _ := staff["first_name"].(string)
	lastName, _ := staff["last_name"].(string)
	name := firstName + " " + lastName
	if name == " " {
		name, _ = staff["emergency_contact_name"].(string)
	}

	if isPendingApprovalStatus(verificationStatus) {
		notifyApprovalRequest(
			staffType,
			fmt.Sprintf("Name: %s", name),
			fmt.Sprintf("Contact: %s", contactNumber),
		)

		// Notify the requester that their request was received
		notifyApprovalDecision(
			contactNumber,
			staffType,
			"received and is currently pending approval",
		)
	} else if isApprovedStatus(verificationStatus) {
		// Send SMS to requester when they are approved
		notifyApprovalDecision(
			contactNumber,
			staffType,
			"approved",
			formatDecisionDetail("Name", name),
		)
	}
	return nil
}
