@echo off
echo ========================================
echo SafeSphere - Quick Start Script
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate
echo.

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
echo.

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
)

REM Run migrations
echo Running database migrations...
python manage.py migrate
echo.

REM Collect static files
echo Collecting static files...
python manage.py collectstatic --noinput
echo.

echo ========================================
echo Setup complete! Starting server...
echo ========================================
echo.
echo Visit: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

REM Start development server
python manage.py runserver
