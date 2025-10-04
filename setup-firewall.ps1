# Add Windows Firewall Rule for Node.js Development Server
# This script must be run as Administrator

Write-Host "Adding Windows Firewall rule for Node.js development server..." -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit 1
}

Write-Host "Running as Administrator" -ForegroundColor Green
Write-Host ""

# Add firewall rule for port 5000 (backend server)
Write-Host "Adding firewall rule for port 5000 (Backend API)..." -ForegroundColor Yellow

try {
    # Remove existing rule if it exists
    netsh advfirewall firewall delete rule name="Emergency Dispatch Backend (Development)" 2>$null
    
    # Add new rule for all profiles (Domain, Private, Public)
    netsh advfirewall firewall add rule `
        name="Emergency Dispatch Backend (Development)" `
        dir=in `
        action=allow `
        protocol=TCP `
        localport=5000 `
        profile=any `
        enable=yes
    
    Write-Host "Firewall rule added successfully for port 5000!" -ForegroundColor Green
} catch {
    Write-Host "Failed to add firewall rule: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verify the rule was added
Write-Host "Verifying firewall rule..." -ForegroundColor Yellow
$rule = netsh advfirewall firewall show rule name="Emergency Dispatch Backend (Development)"

if ($rule) {
    Write-Host "Firewall rule verified!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Rule Details:" -ForegroundColor Cyan
    Write-Host $rule
} else {
    Write-Host "Warning: Could not verify firewall rule" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "FIREWALL CONFIGURED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Ensure backend server is running (should already be running)"
Write-Host "2. Test from your computer:"
Write-Host "   curl http://192.168.1.101:5000" -ForegroundColor Gray
Write-Host "3. Test from mobile app (login screen)"
Write-Host ""
Write-Host "To remove this rule later (after development):" -ForegroundColor Yellow
Write-Host '   netsh advfirewall firewall delete rule name="Emergency Dispatch Backend (Development)"' -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
