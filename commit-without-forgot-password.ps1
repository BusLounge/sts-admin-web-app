# PowerShell script to commit all changes EXCEPT forgot password files

Write-Host "🚀 Committing changes (excluding forgot password files)..." -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
Set-Location "C:\Users\Acer\Desktop\AASL Project\sts-admin-web-app"

# Stage all changes
Write-Host "📦 Staging all changes..." -ForegroundColor Green
git add -A

# Unstage forgot password related files
Write-Host "❌ Excluding forgot password files..." -ForegroundColor Yellow
git reset HEAD FORGOT_PASSWORD_GUIDE.md 2>$null
git reset HEAD SECURITY_NOTICE.md 2>$null
git reset HEAD frontend/docs/FORGOT_PASSWORD_GUIDE.md 2>$null
git reset HEAD frontend/src/app/pages/reset-password/ 2>$null

Write-Host ""
Write-Host "✅ Files staged for commit" -ForegroundColor Green
Write-Host ""

# Show what will be committed
Write-Host "📋 Changes to be committed:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "⚠️  Excluded files (not being committed):" -ForegroundColor Yellow
Write-Host "  - FORGOT_PASSWORD_GUIDE.md"
Write-Host "  - SECURITY_NOTICE.md"
Write-Host "  - frontend/docs/FORGOT_PASSWORD_GUIDE.md"
Write-Host "  - frontend/src/app/pages/reset-password/"

Write-Host ""
$confirm = Read-Host "Do you want to commit these changes? (y/n)"

if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    Write-Host ""
    Write-Host "✅ Creating commit..." -ForegroundColor Green
    
    git commit -m "feat: implement complaint escalation system with SMS notifications

- Add in-memory escalation service with 3-level hierarchy
- Implement automatic escalation after 5 days if unresolved
- Add Dialog SMS integration with dev/production modes
- Create escalation scheduler that runs hourly
- Add team assignment configuration by category and level
- Implement complaint management endpoints
- Add escalation statistics and tracking APIs
- Include email service for notifications
- Add comprehensive documentation and setup guides
- Update admin authentication handlers
- Enhance frontend services and components
- Add lounge and bus booking improvements"

    Write-Host ""
    Write-Host "🎉 Commit created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📤 To push to remote, run:" -ForegroundColor Cyan
    Write-Host "   git push origin branchSu"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Commit cancelled." -ForegroundColor Red
    Write-Host "💡 Changes are still staged. You can:" -ForegroundColor Yellow
    Write-Host "   - Review: git status"
    Write-Host "   - Unstage all: git reset HEAD"
    Write-Host "   - Commit manually: git commit -m 'your message'"
    Write-Host ""
}

Write-Host "📝 Note: Forgot password files remain uncommitted and can be committed separately later." -ForegroundColor Yellow
