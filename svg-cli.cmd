@echo off
chcp 65001 >nul
if exist "%~dp0runtime\node.exe" (
  "%~dp0runtime\node.exe" "%~dp0dist\src\cli\Main.js" %*
) else (
  node "%~dp0dist\src\cli\Main.js" %*
)
exit /b %errorlevel%
