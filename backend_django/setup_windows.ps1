# AmoCart Windows PowerShell Environment Setup
Write-Host "Setting up AmoCart Django and MySQL environment..." -ForegroundColor Cyan

# Check Python installation
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Error "Python is not installed or not in PATH."
    exit 1
}

# Create virtualenv
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "Created Python virtual environment in ./venv" -ForegroundColor Green
}

# Activate virtualenv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy .env if not exists
if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "Created .env configuration file." -ForegroundColor Yellow
}

# Run migrations
python manage.py makemigrations accounts store orders payments inventory
python manage.py migrate

Write-Host "AmoCart setup completed successfully! Run 'python manage.py runserver' to start." -ForegroundColor Green
