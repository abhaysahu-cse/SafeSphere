@echo off
REM SafeSphere - GitHub Push Script for Windows
REM This script will push your project to GitHub

echo ==========================================
echo   SafeSphere - GitHub Push Script
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist "manage.py" (
    echo ERROR: Not in the correct directory!
    echo Please run this script from: safespera-old\safespera\
    pause
    exit /b 1
)

echo [OK] Correct directory confirmed
echo.

REM Check git status
echo [INFO] Checking git status...
git status
echo.

REM Add all files
echo [INFO] Adding all files to git...
git add .
echo [OK] Files added
echo.

REM Commit
echo [INFO] Creating commit...
git commit -m "Production ready: SafeSphere disaster preparedness platform - Features: AI chatbot with Gemini API, Emergency map with heatwave zones, Google Maps integration, 15+ hospitals and 8+ community centers, Certificate generation, Mobile-responsive design, User authentication and gamification"
echo [OK] Commit created
echo.

REM Ask for GitHub username
echo ==========================================
echo   GitHub Repository Setup
echo ==========================================
echo.
set /p github_username="Enter your GitHub username: "

if "%github_username%"=="" (
    echo ERROR: GitHub username cannot be empty
    pause
    exit /b 1
)

REM Set remote
echo.
echo [INFO] Connecting to GitHub...
git remote remove origin 2>nul
git remote add origin "https://github.com/%github_username%/safesphere.git"
echo [OK] Connected to: https://github.com/%github_username%/safesphere
echo.

REM Push to GitHub
echo [INFO] Pushing to GitHub...
echo.
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo   SUCCESS! Project pushed to GitHub!
    echo ==========================================
    echo.
    echo Your repository is now live at:
    echo    https://github.com/%github_username%/safesphere
    echo.
    echo Next steps:
    echo    1. Visit your repository
    echo    2. Add description and topics
    echo    3. Share with investors and team
    echo.
) else (
    echo.
    echo ==========================================
    echo   Push Failed
    echo ==========================================
    echo.
    echo Possible reasons:
    echo 1. Repository doesn't exist on GitHub
    echo    - Create it at: https://github.com/new
    echo 2. Authentication failed
    echo    - Check your GitHub credentials
    echo 3. Network issues
    echo    - Check your internet connection
    echo.
    echo See DEPLOY_TO_GITHUB.md for detailed instructions
    echo.
)

pause
