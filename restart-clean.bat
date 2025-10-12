@echo off
echo Cleaning Vite cache...
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist 2>nul
echo.
echo Starting dev server...
npm run dev
