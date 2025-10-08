# Check Current IP Address for Mobile App Configuration
# Run this script to find your current IP: .\check-ip.ps1

Write-Host ""
Write-Host "Network Configuration Checker" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Get IPv4 addresses (exclude localhost)
Write-Host "Your IP Addresses:" -ForegroundColor Green
ipconfig | Select-String -Pattern "IPv4" | ForEach-Object {
    Write-Host $_.Line
}

Write-Host ""
Write-Host "For Mobile App:" -ForegroundColor Yellow
Write-Host "  Use the IP from your WiFi/Ethernet adapter (usually 192.168.x.x)"
Write-Host "  Example: http://192.168.1.103:5000/api"

Write-Host ""
Write-Host "To Update Backend:" -ForegroundColor Cyan
Write-Host "  1. Open apps/backend/.env"
Write-Host "  2. Update MOBILE_IPS=192.168.1.103,other-ips"
Write-Host "  3. Restart backend server"

Write-Host ""
Write-Host "Current .env Configuration:" -ForegroundColor Green
$envPath = "apps\backend\.env"
if (Test-Path $envPath) {
    $content = Get-Content $envPath | Select-String -Pattern "MOBILE_IPS"
    if ($content) {
        Write-Host "  $content"
    } else {
        Write-Host "  MOBILE_IPS not set (using automatic detection)"
    }
}

Write-Host ""
Write-Host "Tip: Server auto-accepts 192.168.x.x, 172.16-31.x.x, and 10.x.x.x ranges!" -ForegroundColor Cyan
Write-Host ""
