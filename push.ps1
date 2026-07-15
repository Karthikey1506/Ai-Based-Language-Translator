# Git Push Automation Script for LingoAI
Clear-Host
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "📤  LingoAI GitHub Export Assistant" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Verify if git is installed
$GitCheck = Get-Command git -ErrorAction SilentlyContinue
if (-not $GitCheck) {
    Write-Host "❌ Git is not installed or not configured in your system PATH." -ForegroundColor Red
    Write-Host "Please download and install Git from: https://git-scm.com/" -ForegroundColor Yellow
    Write-Host "Once installed, restart your terminal and run this script again!" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

# Prompt for GitHub Repository URL
$RepoUrl = Read-Host "Enter your GitHub Repository URL (e.g., https://github.com/your-username/your-repo.git)"
if ([string]::IsNullOrWhiteSpace($RepoUrl)) {
    Write-Host "❌ Repository URL cannot be empty." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# Configure Git ignore rules (ignoring node_modules to avoid pushing huge packages)
Write-Host "Configuring ignore rules (.gitignore)..." -ForegroundColor Gray
$GitIgnoreContent = @"
node_modules/
backend/node_modules/
backend/uploads/
frontend/node_modules/
frontend/dist/
.env
.env.*
*.log
.git/
"@
Set-Content -Path ".gitignore" -Value $GitIgnoreContent

# Initialize repository, stage files, and commit
Write-Host "Initializing Git repository..." -ForegroundColor Gray
git init

Write-Host "Staging files (excluding ignored packages)..." -ForegroundColor Gray
git add .

Write-Host "Creating initial commit..." -ForegroundColor Gray
git commit -m "Initial commit: LingoAI translation platform"

# Configure branch and remote link
Write-Host "Setting main branch and repository link..." -ForegroundColor Gray
git branch -M main

$RemoteExists = git remote | Where-Object { $_ -eq "origin" }
if ($RemoteExists) {
    git remote set-url origin $RepoUrl
} else {
    git remote add origin $RepoUrl
}

# Push files
Write-Host "Pushing files to GitHub (a GitHub login dialog may pop up)..." -ForegroundColor Gray
git push -u origin main -f

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host "🎉 SUCCESS! Your code has been uploaded to GitHub." -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Failed to push files. Please check repository URL or credentials." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
