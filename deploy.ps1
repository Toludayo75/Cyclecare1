# Deployment script for CycleCare Health Manager
# Usage: .\deploy.ps1

param(
    [string]$Environment = "development",
    [switch]$SkipBuild = $false,
    [switch]$SkipMigrations = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CycleCare Health Manager - Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Load environment variables
Write-Host "`nLoading environment variables..." -ForegroundColor Cyan
$envFile = ".env"
if (-Not (Test-Path $envFile)) {
    Write-Host "Error: .env not found" -ForegroundColor Red
    exit 1
}

foreach ($line in Get-Content $envFile) {
    if ($line -match '^[^#]' -and $line.Trim() -ne '') {
        $parts = $line -split '=', 2
        if ($parts.Count -eq 2) {
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
}
Write-Host "Environment loaded" -ForegroundColor Green

# Build if not skipped
if (-not $SkipBuild) {
    Write-Host "`nBuilding packages..." -ForegroundColor Cyan
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Install failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Building API server..." -ForegroundColor Cyan
    pnpm --filter @workspace/api-server run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "API server build failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "Building admin portal..." -ForegroundColor Cyan
    pnpm --filter @workspace/admin run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Admin portal build failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "Building NGO portal..." -ForegroundColor Cyan
    pnpm --filter @workspace/ngo-portal run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "NGO portal build failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "Building public dashboard..." -ForegroundColor Cyan
    pnpm --filter @workspace/public-dashboard run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Public dashboard build failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "Building mobile app..." -ForegroundColor Cyan
    pnpm --filter @workspace/cyclecare run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Mobile app build failed" -ForegroundColor Red
        exit 1
    }
}

# Run migrations if not skipped
if (-not $SkipMigrations) {
    Write-Host "`nRunning database migrations..." -ForegroundColor Cyan
    node .\lib\db\create-tables.mjs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Migrations failed (continuing...)" -ForegroundColor Yellow
    }
}

# Start all services
Write-Host "`nStarting services..." -ForegroundColor Cyan
Write-Host "Note: Open new terminal windows for each service:" -ForegroundColor Yellow

Write-Host "`n1. Mobile App (Expo):" -ForegroundColor Green
Write-Host "   pnpm --filter @workspace/cyclecare dev" -ForegroundColor White

Write-Host "`n2. Admin Portal:" -ForegroundColor Green
Write-Host "   `$env:PORT=4173; `$env:BASE_PATH='/'; pnpm --filter @workspace/admin dev" -ForegroundColor White

Write-Host "`n3. NGO Portal:" -ForegroundColor Green
Write-Host "   `$env:PORT=4174; `$env:BASE_PATH='/'; pnpm --filter @workspace/ngo-portal dev" -ForegroundColor White

Write-Host "`n4. API Server:" -ForegroundColor Green
Write-Host "   pnpm --filter @workspace/api-server run start" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
