package main

import (
	"database/sql"
	"log"
	"sts-backend/internal/services"

	_ "github.com/lib/pq"
	"sts-backend/internal/database"
)

// Expose the unexported notifyApprovalRequest via a local copy or just copy its code?
// Since it's in the same package `services`, we can't easily call it unless we put it in the same package.
