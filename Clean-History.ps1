# Clean credentials.json from entire git history
# Run from the repository root

Write-Host "🧹 Cleaning git history of credentials.json..." -ForegroundColor Green
Write-Host "=============================================="

try {
    # Check if we're in a git repository
    git rev-parse --git-dir | Out-Null
    
    Write-Host "`n📍 Step 1: Creating backup branch..." -ForegroundColor Cyan
    git branch backup-before-clean
    Write-Host "✅ Backup created: backup-before-clean"
    
    Write-Host "`n📍 Step 2: Setting environment variable..." -ForegroundColor Cyan
    $Env:FILTER_BRANCH_SQUELCH_WARNING = "1"
    Write-Host "✅ Environment configured"
    
    Write-Host "`n📍 Step 3: Removing credentials.json from all commits..." -ForegroundColor Cyan
    Write-Host "⏳ This may take a moment..." -ForegroundColor Yellow
    
    # Run filter-branch to remove the file
    & git filter-branch -f --tree-filter 'rm -f credentials.json' -- --all
    
    Write-Host "`n✅ History cleaned successfully"
    
    Write-Host "`n📍 Step 4: Cleaning git garbage collection..." -ForegroundColor Cyan
    git gc --aggressive --prune=all
    Write-Host "✅ Garbage collection complete"
    
    Write-Host "`n🚀 Step 5: Force pushing cleaned history..." -ForegroundColor Cyan
    git push origin --force-with-lease thilan-kavinda
    Write-Host "✅ Push successful!"
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "✨ Repository cleaned and pushed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Important for other developers:" -ForegroundColor Yellow
    Write-Host "   If anyone else has cloned this repo, they need to:" -ForegroundColor Yellow
    Write-Host "   git pull --rebase origin thilan-kavinda" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Recovery options:" -ForegroundColor Yellow
    Write-Host "1. If filtering failed, delete the backup branch: git branch -D backup-before-clean" -ForegroundColor Yellow
    Write-Host "2. Check the error message above and try again" -ForegroundColor Yellow
    exit 1
}
