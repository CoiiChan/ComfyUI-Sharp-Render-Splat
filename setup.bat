@echo off
REM Splat Orbit Render - Windows Batch Script
REM Quick start script for Windows users

echo ========================================
echo Splat Orbit Render - Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed.
echo.

REM Change to sharp-render-splat-transform directory
if not exist "sharp-render-splat-transform" (
    echo ERROR: sharp-render-splat-transform directory not found
    pause
    exit /b 1
)

cd sharp-render-splat-transform
echo Changed to: %CD%
echo.

REM Step 1: Install project root dependencies
echo ========================================
echo Step 1: Installing project root dependencies...
echo ========================================
if not exist "node_modules" (
    echo Installing project dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install project dependencies
        cd ..
        pause
        exit /b 1
    )
    echo Project dependencies installed successfully.
) else (
    echo Project dependencies already installed.
)
echo.

REM Step 2: Install orbit-render tool dependencies
echo ========================================
echo Step 2: Installing orbit-render tool dependencies...
echo ========================================
if not exist "tools\orbit-render" (
    echo ERROR: tools\orbit-render directory not found
    cd ..
    pause
    exit /b 1
)

cd tools\orbit-render
if not exist "node_modules" (
    echo Installing orbit-render dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install orbit-render dependencies
        cd ..\..
        pause
        exit /b 1
    )
    echo Orbit-render dependencies installed successfully.
) else (
    echo Orbit-render dependencies already installed.
)
cd ..\..
echo.

REM Step 3: Verify installation
echo ========================================
echo Verifying installation...
echo ========================================
if exist "node_modules" (
    echo [OK] Project dependencies are installed
) else (
    echo [ERROR] Project dependencies are missing
)

if exist "tools\orbit-render\node_modules" (
    echo [OK] Orbit-render dependencies are installed
) else (
    echo [ERROR] Orbit-render dependencies are missing
)
echo.

echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Usage examples:
echo.
echo 1. Test orbit-render with your PLY file:
echo    cd tools\orbit-render
echo    node index.mjs input.ply
echo.
echo 2. Render with custom settings:
echo    node index.mjs input.ply -f 72 -r 10 -o ./my_frames
echo.
echo 3. Show help:
echo    node index.mjs --help
echo.
echo For more information, see README.md
echo.
pause
