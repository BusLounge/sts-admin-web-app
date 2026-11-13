package database

import (
	"database/sql"
	"fmt"
	"strings"
)

// RemoveUserRole removes a specific role from a user's roles array.
// If the resulting roles array is empty, it defaults to ['passenger'].
func RemoveUserRole(tx *sql.Tx, userID string, role string) error {
	if strings.TrimSpace(userID) == "" {
		return nil
	}
	role = strings.TrimSpace(role)
	query := `
		UPDATE public.users
		SET roles = CASE 
			WHEN array_remove(COALESCE(roles, ARRAY[]::text[]), $1) = '{}' 
			     OR array_remove(COALESCE(roles, ARRAY[]::text[]), $1) IS NULL 
				THEN ARRAY['passenger']::text[]
			ELSE array_remove(COALESCE(roles, ARRAY[]::text[]), $1)
		END,
		updated_at = NOW()
		WHERE id::text = $2
	`
	var err error
	if tx != nil {
		_, err = tx.Exec(query, role, userID)
	} else {
		_, err = DB.Exec(query, role, userID)
	}
	if err != nil {
		return fmt.Errorf("error removing role '%s' from user '%s': %w", role, userID, err)
	}
	return nil
}

// AddUserRole adds a specific role to a user's roles array if not already present.
func AddUserRole(tx *sql.Tx, userID string, role string) error {
	if strings.TrimSpace(userID) == "" {
		return nil
	}
	role = strings.TrimSpace(role)
	query := `
		UPDATE public.users
		SET roles = CASE
			WHEN NOT ($1 = ANY(COALESCE(roles, ARRAY[]::text[]))) 
				THEN array_append(COALESCE(roles, ARRAY[]::text[]), $1)
			ELSE roles
		END,
		updated_at = NOW()
		WHERE id::text = $2
	`
	var err error
	if tx != nil {
		_, err = tx.Exec(query, role, userID)
	} else {
		_, err = DB.Exec(query, role, userID)
	}
	if err != nil {
		return fmt.Errorf("error adding role '%s' to user '%s': %w", role, userID, err)
	}
	return nil
}

// SyncUserRoleWithVerificationStatus updates a user's role based on verification status.
// If status is "rejected", the role is removed.
// If status is "verified" or "approved", the role is added.
func SyncUserRoleWithVerificationStatus(tx *sql.Tx, userID string, role string, status string) error {
	if strings.TrimSpace(userID) == "" {
		return nil
	}
	normStatus := strings.ToLower(strings.TrimSpace(status))
	if normStatus == "rejected" {
		return RemoveUserRole(tx, userID, role)
	} else if normStatus == "verified" || normStatus == "approved" {
		return AddUserRole(tx, userID, role)
	}
	return nil
}
