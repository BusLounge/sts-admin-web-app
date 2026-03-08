# Git Commit Plan: Escalation System (Excluding Forgot Password)

## Files to EXCLUDE (Forgot Password Related)

### Documentation Files
- `FORGOT_PASSWORD_GUIDE.md` (root)
- `frontend/docs/FORGOT_PASSWORD_GUIDE.md`
- `SECURITY_NOTICE.md`

### Component Files
- `frontend/src/app/pages/reset-password/` (entire directory)

### Mixed Files (Need Selective Staging)
These files have BOTH escalation AND forgot password changes:
- `backend/cmd/server/main.go` - Has password reset routes
- `backend/internal/handlers/admin_auth_handler.go` - Has password reset functions
- `backend/internal/config/config.go` - Has email config
- `frontend/src/app/pages/login/login.component.ts` - Has forgot password modal
- `frontend/src/app/core/services/admin-auth.service.ts` - Has password reset methods

## Files to COMMIT (Escalation System)

### Backend - Escalation Documentation
```bash
git add backend/COMPLAINT_ESCALATION_README.md
git add backend/DIALOG_SMS_CONFIGURATION.md
git add backend/ESCALATION_QUICK_FIX.md
git add backend/ESCALATION_QUICK_START.md
git add backend/ESCALATION_TROUBLESHOOTING.md
git add backend/IN_MEMORY_ESCALATION_GUIDE.md
git add backend/SMS_ESCALATION_SETUP.md
git add backend/TEAM_CATEGORY_MATCHING.md
git add backend/GMAIL_SETUP_GUIDE.md
```

### Backend - Escalation SQL/Scripts
```bash
git add backend/check_escalation_setup.sql
git add backend/complaint_escalation_schema.sql
git add backend/setup_escalation.bat
git add backend/setup_escalation.ps1
```

### Backend - Escalation Code
```bash
git add backend/internal/config/assignment.go
git add backend/internal/database/complaint_repository.go
git add backend/internal/handlers/complaint_handler.go
git add backend/internal/handlers/escalation_handler.go
git add backend/internal/models/complaint.go
git add backend/internal/models/escalation.go
git add backend/internal/services/complaint_service.go
git add backend/internal/services/escalation_scheduler.go
git add backend/internal/services/escalation_service.go
git add backend/internal/services/sms_service.go
```

### Backend - Escalation Tools
```bash
git add backend/cmd/apply_escalation_schema/
git add backend/cmd/check_escalation/
git add backend/cmd/test_complaints/
```

### Frontend - Escalation Files
```bash
git add frontend/FRONTEND_ESCALATION_GUIDE.md
git add frontend/src/app/core/models/complaint.model.ts
git add frontend/src/app/core/services/complaint.service.ts
git add frontend/src/app/core/services/escalation.service.ts
```

### Root Documentation (Escalation)
```bash
git add ESCALATION_IMPLEMENTATION_SUMMARY.md
git add ESCALATION_SYSTEM_SUMMARY.md
```

## Modified Files - Needs Manual Review

For files with BOTH escalation and forgot password changes, you have two options:

### Option 1: Commit All Changes Now (Easier)
If you want to include forgot password in this commit:
```bash
git add backend/cmd/server/main.go
git add backend/internal/handlers/admin_auth_handler.go
git add backend/internal/config/config.go
git add backend/internal/services/email_service.go
git add backend/.env.example
git add frontend/src/app/pages/login/login.component.ts
git add frontend/src/app/core/services/admin-auth.service.ts
# ... and other modified frontend files
```

### Option 2: Selective Staging (Recommended - Exclude Forgot Password)
Use interactive staging to select only escalation changes:

```bash
# For each mixed file, use interactive add
git add -p backend/cmd/server/main.go
# Press 'y' for escalation-related hunks
# Press 'n' for password reset routes (forgot-password, verify-reset-token, reset-password)

git add -p backend/internal/handlers/admin_auth_handler.go
# Press 'n' for password reset functions (RequestPasswordReset, VerifyResetToken, ResetPassword)
# Press 'y' for other changes if any

git add -p backend/internal/config/config.go
# Review each hunk - keep SMS config, skip email config if only for password reset

git add -p backend/internal/services/email_service.go
# Press 'n' for SendPasswordResetEmail function
# Press 'y' for other email functions if needed

# For frontend files, similarly review each change
git add -p frontend/src/app/pages/login/login.component.ts
git add -p frontend/src/app/core/services/admin-auth.service.ts
```

## Quick Commit Script (Escalation Only - Clean Files)

Run this to add all new escalation files:

```bash
# Backend escalation files
git add backend/COMPLAINT_ESCALATION_README.md
git add backend/DIALOG_SMS_CONFIGURATION.md
git add backend/ESCALATION_QUICK_FIX.md
git add backend/ESCALATION_QUICK_START.md
git add backend/ESCALATION_TROUBLESHOOTING.md
git add backend/IN_MEMORY_ESCALATION_GUIDE.md
git add backend/SMS_ESCALATION_SETUP.md
git add backend/TEAM_CATEGORY_MATCHING.md
git add backend/GMAIL_SETUP_GUIDE.md
git add backend/check_escalation_setup.sql
git add backend/complaint_escalation_schema.sql
git add backend/setup_escalation.bat
git add backend/setup_escalation.ps1
git add backend/internal/config/assignment.go
git add backend/internal/database/complaint_repository.go
git add backend/internal/handlers/complaint_handler.go
git add backend/internal/handlers/escalation_handler.go
git add backend/internal/models/complaint.go
git add backend/internal/models/escalation.go
git add backend/internal/services/complaint_service.go
git add backend/internal/services/escalation_scheduler.go
git add backend/internal/services/escalation_service.go
git add backend/internal/services/sms_service.go
git add backend/cmd/apply_escalation_schema/
git add backend/cmd/check_escalation/
git add backend/cmd/test_complaints/

# Frontend escalation files
git add frontend/FRONTEND_ESCALATION_GUIDE.md
git add frontend/src/app/core/models/complaint.model.ts
git add frontend/src/app/core/services/complaint.service.ts
git add frontend/src/app/core/services/escalation.service.ts

# Root documentation
git add ESCALATION_IMPLEMENTATION_SUMMARY.md
git add ESCALATION_SYSTEM_SUMMARY.md

# Now commit
git commit -m "feat: implement in-memory complaint escalation system with SMS notifications

- Add 3-level escalation hierarchy for complaint categories
- Implement automatic escalation after 5 days if unresolved  
- Add SMS notifications via Dialog eSMS (dev/production modes)
- Create escalation scheduler (runs hourly)
- Add team assignment configuration by category and level
- Implement manual escalation API endpoints
- Add escalation statistics and tracking
- Include comprehensive documentation and setup guides"
```

## What About Modified Files with Mixed Changes?

If you choose Option 2 (selective staging), after committing the clean escalation files above, you can:

1. **Now**: Commit escalation system (clean files only)
2. **Later**: Create a separate commit for forgot password feature

Or if you want a simpler approach:

**Just exclude the forgot password documentation and reset-password component:**
```bash
# Add everything except specific forgot password files
git add .
git reset HEAD FORGOT_PASSWORD_GUIDE.md
git reset HEAD SECURITY_NOTICE.md
git reset HEAD frontend/docs/FORGOT_PASSWORD_GUIDE.md
git reset HEAD frontend/src/app/pages/reset-password/

git commit -m "feat: implement escalation system with forgot password functionality"
```

## Recommended Approach

**Simplest**: Commit everything including forgot password (since the code is already integrated)
**Cleanest**: Use the quick commit script above for escalation-only files, then handle modified files separately

Choose based on your needs!
