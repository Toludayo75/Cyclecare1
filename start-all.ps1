# Start all services in parallel
# Usage: .\start-all.ps1

Write-Host "Loading environment variables..." -ForegroundColor Cyan
. .\load-env.ps1

Write-Host "`nStarting all services in new terminals..." -ForegroundColor Cyan

# Mobile app
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm --filter @workspace/cyclecare dev" -WindowStyle Normal
Write-Host "✓ Mobile app started (exp://127.0.0.1:8081)" -ForegroundColor Green

# Admin portal  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PORT='4173'; `$env:BASE_PATH='/'; cd '$PWD'; pnpm --filter @workspace/admin dev" -WindowStyle Normal
Write-Host "✓ Admin portal started (http://localhost:4173)" -ForegroundColor Green

# NGO portal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PORT='4174'; `$env:BASE_PATH='/'; cd '$PWD'; pnpm --filter @workspace/ngo-portal dev" -WindowStyle Normal
Write-Host "✓ NGO portal started (http://localhost:4174)" -ForegroundColor Green

# API server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm --filter @workspace/api-server run start" -WindowStyle Normal
Write-Host "✓ API server started (http://localhost:5000)" -ForegroundColor Green

Write-Host "`nAll services started!" -ForegroundColor Cyan
Write-Host "Check the new terminal windows for service output." -ForegroundColor Yellow
