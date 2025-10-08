# 📱 Update Mobile App IP Address
# This script helps you update the mobile app's API configuration

Write-Host ""
Write-Host "Mobile App IP Updater" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Get your current IP
Write-Host "Your IP Addresses:" -ForegroundColor Green
ipconfig | Select-String -Pattern "IPv4" | ForEach-Object {
    Write-Host $_.Line
}

Write-Host ""
Write-Host "Enter your IP address (the one from WiFi/Ethernet):" -ForegroundColor Yellow
Write-Host "Example: 192.168.1.103" -ForegroundColor DarkGray
$selectedIP = Read-Host "IP Address"

if ([string]::IsNullOrWhiteSpace($selectedIP)) {
    Write-Host "No IP entered. Exiting." -ForegroundColor Red
    exit 1
}

# Validate IP format
if ($selectedIP -notmatch '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$') {
    Write-Host "Invalid IP format! Please use format: 192.168.1.103" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Updating mobile app with IP: $selectedIP" -ForegroundColor Green
Write-Host ""

# Update the constants file
$constantsFile = "apps\mobile\src\constants\index.ts"

if (-not (Test-Path $constantsFile)) {
    Write-Host "Error: Could not find $constantsFile" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Get current date
$currentDate = Get-Date -Format "MMMM d, yyyy"

# Read and update
$content = Get-Content $constantsFile -Raw

# Replace IPs using simple string replacement
$newApiUrl = "http://$selectedIP:5000/api"
$newWsUrl = "http://$selectedIP:5000"

$content = $content -replace 'API_BASE_URL = "http://[^"]+";', "API_BASE_URL = `"$newApiUrl`";"
$content = $content -replace 'WEBSOCKET_URL = "http://[^"]+";', "WEBSOCKET_URL = `"$newWsUrl`";"
$content = $content -replace '// CURRENT IP: [^\r\n]+', "// CURRENT IP: $selectedIP (Updated: $currentDate)"

# Write back
$content | Set-Content $constantsFile -NoNewline

Write-Host "✅ Successfully updated!" -ForegroundColor Green
Write-Host ""
Write-Host "New configuration:" -ForegroundColor White
Write-Host "  API_BASE_URL: $newApiUrl" -ForegroundColor Cyan
Write-Host "  WEBSOCKET_URL: $newWsUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Make sure backend is running: cd apps/backend, then npm run dev" -ForegroundColor White
Write-Host "  2. Restart your mobile app (shake device -> Reload)" -ForegroundColor White
Write-Host "  3. Ensure phone and PC are on the same WiFi network" -ForegroundColor White
Write-Host ""
