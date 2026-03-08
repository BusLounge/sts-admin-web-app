# PowerShell script to commit escalation system files (excluding forgot password)

Write-Host "🚀 Committing Escalation System Files..." -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
Set-Location "C:\Users\Acer\Desktop\AASL Project\sts-admin-web-app"

Write-Host "📦 Adding backend escalation documentation..." -ForegroundColor Green
git add backend/COMPLAINT_ESCALATION_README.md
git add backend/DIALOG_SMS_CONFIGURATION.md
git add backend/ESCALATION_QUICK_FIX.md
git add backend/ESCALATION_QUICK_START.md
git add backend/ESCALATION_TROUBLESHOOTING.md
git add backend/IN_MEMORY_ESCALATION_GUIDE.md
git add backend/SMS_ESCALATION_SETUP.md
git add backend/TEAM_CATEGORY_MATCHING.md
git add backend/GMAIL_SETUP_GUIDE.md

Write-Host "📦 Adding backend escalation SQL/scripts..." -ForegroundColor Green
git add backend/check_escalation_setup.sql
git add backend/complaint_escalation_schema.sql
git add backend/setup_escalation.bat
git add backend/setup_escalation.ps1

Write-Host "📦 Adding backend escalation code..." -ForegroundColor Green
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

Write-Host "📦 Adding backend escalation tools..." -ForegroundColor Green
git add backend/cmd/apply_escalation_schema/
git add backend/cmd/check_escalation/
git add backend/cmd/test_complaints/

Write-Host "📦 Adding frontend escalation files..." -ForegroundColor Green
git add frontend/FRONTEND_ESCALATION_GUIDE.md
git add frontend/src/app/core/models/complaint.model.ts
git add frontend/src/app/core/services/complaint.service.ts
git add frontend/src/app/core/services/escalation.service.ts

Write-Host "📦 Adding root documentation..." -ForegroundColor Green
git add ESCALATION_IMPLEMENTATION_SUMMARY.md
git add ESCALATION_SYSTEM_SUMMARY.md

Write-Host "📦 Adding email service (used by escalation)..." -ForegroundColor Green
git add backend/internal/services/email_service.go

Write-Host "📦 Adding modified config files..." -ForegroundColor Green
git add backend/internal/config/config.go
git add backend/.env.example

Write-Host "📦 Adding modified main.go..." -ForegroundColor Green
git add backend/cmd/server/main.go

Write-Host "📦 Adding modified admin auth handler..." -ForegroundColor Green
git add backend/internal/handlers/admin_auth_handler.go

Write-Host ""
Write-Host "⚠️  NOTE: The following forgot password files will be EXCLUDED:" -ForegroundColor Yellow
Write-Host "  - FORGOT_PASSWORD_GUIDE.md"
Write-Host "  - SECURITY_NOTICE.md"
Write-Host "  - frontend/docs/FORGOT_PASSWORD_GUIDE.md"
Write-Host "  - frontend/src/app/pages/reset-password/"
Write-Host ""

Write-Host "📋 Checking what will be committed..." -ForegroundColor Cyan
git status

Write-Host ""
$confirm = Read-Host "Do you want to commit these changes? (y/n)"

if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    Write-Host "✅ Creating commit..." -ForegroundColor Green
    git commit -m "feat: implement in-memory complaint escalation system with SMS notifications

- Add 3-level escalation hierarchy for complaint categories
- Implement automatic escalation after 5 days if unresolved
- Add SMS notifications via Dialog eSMS (dev/production modes)
- Create escalation scheduler (runs hourly)
- Add team assignment configuration by category and level
- Implement manual escalation API endpoints
- Add escalation statistics and tracking
- Include email service for notifications
- Include comprehensive documentation and setup guides"

    Write-Host ""
    Write-Host "🎉 Commit created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📤 To push to remote, run:" -ForegroundColor Cyan
    Write-Host "   git push origin branchSu"
} else {
    Write-Host "❌ Commit cancelled." -ForegroundColor Red
    Write-Host "💡 You can review the staged changes with: git status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Forgot password files that were excluded:" -ForegroundColor Yellow
Write-Host "   You can commit these later with a separate commit if needed."
