# LingoAI Project Verification Script
Clear-Host
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🛡️  LingoAI Integrity & Verification Check" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$Passed = $true

# Helper function for pass/fail output
function Report-Status($Name, $Success, $Details) {
    if ($Success) {
        Write-Host "[PASS] " -NoNewline -ForegroundColor Green
        Write-Host "${Name}: ${Details}"
    } else {
        Write-Host "[FAIL] " -NoNewline -ForegroundColor Red
        Write-Host "${Name}: ${Details}" -ForegroundColor Yellow
        $script:Passed = $false
    }
}

# 1. Check folder structure and required files
Write-Host "1. Checking Core Files..." -ForegroundColor Gray
$RequiredFiles = @(
    "package.json",
    "backend/package.json",
    "backend/server.js",
    "backend/database.js",
    "frontend/package.json",
    "frontend/index.html",
    "frontend/src/main.jsx",
    "frontend/src/App.jsx",
    "frontend/src/index.css",
    "frontend/src/components/Translator.jsx",
    "frontend/src/components/History.jsx",
    "frontend/src/components/DocTranslator.jsx",
    "frontend/src/components/OcrTranslator.jsx",
    "frontend/src/components/ChatBot.jsx",
    "frontend/src/components/ThemeToggle.jsx",
    "frontend/src/utils/api.js"
)

foreach ($File in $RequiredFiles) {
    if (Test-Path $File) {
        Report-Status "File Exist" $true "$File is present"
    } else {
        Report-Status "File Exist" $false "$File is missing!"
    }
}
Write-Host ""

# 2. Check Node Modules
Write-Host "2. Checking Dependencies (node_modules)..." -ForegroundColor Gray
$RootModules = Test-Path "node_modules"
$BackendModules = Test-Path "backend/node_modules"
$FrontendModules = Test-Path "frontend/node_modules"

Report-Status "Root Dependencies" $RootModules "node_modules"
Report-Status "Backend Dependencies" $BackendModules "backend/node_modules"
Report-Status "Frontend Dependencies" $FrontendModules "frontend/node_modules"
Write-Host ""

# 3. Test React compilation build
Write-Host "3. Testing Frontend Compile Build..." -ForegroundColor Gray
try {
    $BuildOutput = npm run build --prefix frontend 2>&1
    $BuildSuccess = ($LASTEXITCODE -eq 0)
    Report-Status "Frontend Compile" $BuildSuccess "React app built successfully without errors"
} catch {
    Report-Status "Frontend Compile" $false "Failed to run frontend build: $_"
}
Write-Host ""

# 4. Spin up backend server and test REST API
Write-Host "4. Testing Backend Server API..." -ForegroundColor Gray

# Force stop any node servers running on 5000 first
$PortProcess = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($PortProcess) {
    Stop-Process -Id $PortProcess.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Start backend using Start-Process which is robust and inherits current environment paths
$NodePath = "node"
$ServerScript = "server.js"
$BackendDir = "E:\Projects\ai-translator\backend"

$Proc = Start-Process -FilePath $NodePath -ArgumentList $ServerScript -WorkingDirectory $BackendDir -NoNewWindow -PassThru -ErrorAction SilentlyContinue

if (-not $Proc) {
    # Try using absolute path to node.exe
    $AbsoluteNode = "C:\Program Files\nodejs\node.exe"
    $Proc = Start-Process -FilePath $AbsoluteNode -ArgumentList $ServerScript -WorkingDirectory $BackendDir -NoNewWindow -PassThru
}

Write-Host "Starting backend server (waiting 4s for startup)..."
Start-Sleep -Seconds 4

try {
    # Send a sample translation request
    $Body = @{
        text = "Hello world"
        from = "en"
        to = "es"
        saveToHistory = $false
    } | ConvertTo-Json

    $Response = Invoke-RestMethod -Uri "http://localhost:5000/api/translate" -Method Post -Body $Body -ContentType "application/json" -TimeoutSec 5
    
    if ($Response.translatedText -match "Hola") {
        Report-Status "Translation API" $true "API returned translated text: '$($Response.translatedText)'"
    } else {
        Report-Status "Translation API" $false "API responded but returned unexpected text: '$($Response.translatedText)'"
    }
} catch {
    Report-Status "Translation API" $false "Could not connect or request failed: $_"
} finally {
    # Terminate Node backend server process
    if ($Proc) {
        Stop-Process -Id $Proc.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Final port cleanup check
    $FinalCleanup = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($FinalCleanup) {
        Stop-Process -Id $FinalCleanup.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Write-Host ""

# Final Summary
Write-Host "========================================================" -ForegroundColor Cyan
if ($Passed) {
    Write-Host "✅ LINGOAI VERIFICATION COMPLETE: ALL CHECKS PASSED!" -ForegroundColor Green
} else {
    Write-Host "❌ VERIFICATION FAILED: PLEASE CORRECT FAILURES ABOVE!" -ForegroundColor Red
}
Write-Host "========================================================" -ForegroundColor Cyan
