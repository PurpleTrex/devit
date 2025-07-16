# PowerShell script to generate SQLx query metadata
param(
    [string]$DatabaseUrl = "postgresql://postgres:Friezavegeta9@localhost:5432/devit"
)

Write-Host "Generating SQLx query metadata..."

# Set environment variable
$env:DATABASE_URL = $DatabaseUrl

# Check if .sqlx directory exists, if not create it
if (-not (Test-Path ".sqlx")) {
    New-Item -ItemType Directory -Path ".sqlx" -Force
    Write-Host "Created .sqlx directory"
}

# Generate SQLx data
try {
    Write-Host "Running cargo sqlx prepare..."
    & cargo sqlx prepare
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SQLx metadata generated successfully!"
        Write-Host "Contents of .sqlx directory:"
        Get-ChildItem -Path ".sqlx" -Recurse
    } else {
        Write-Host "❌ Failed to generate SQLx metadata"
        exit 1
    }
} catch {
    Write-Host "❌ Error running cargo sqlx prepare: $_"
    exit 1
}
