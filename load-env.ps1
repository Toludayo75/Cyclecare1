$envFile = ".env"
if (-Not (Test-Path $envFile)) {
    Write-Host "Error: .env not found"
    exit 1
}

foreach ($line in Get-Content $envFile) {
    if ($line -match '^[^#]' -and $line.Trim() -ne '') {
        $parts = $line -split '=', 2
        if ($parts.Count -eq 2) {
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
            Write-Host ('✓ ' + $key)
        }
    }
}
Write-Host 'Environment loaded'
