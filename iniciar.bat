@echo off
title KEV PROCESS - Sistema de Presupuestos y Costeo
color 0B
echo ================================================================
echo           KEV PROCESS SpA - INGENIERIA Y CONTROL
echo       Sistema Web de Presupuesto y Costeo de Proyectos
echo ================================================================
echo.

set NODE_CMD=node
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Users\ASUS\AppData\Roaming\Antigravity\bin\agy-node.cmd" (
        set NODE_CMD="C:\Users\ASUS\AppData\Roaming\Antigravity\bin\agy-node.cmd"
    ) else (
        echo [AVISO] Node.js no encontrado en PATH.
        echo Iniciando en modo autonomo en el navegador...
        start "" "%~dp0public\index.html"
        exit /b 0
    )
)

echo [OK] Iniciando servidor web en http://localhost:3000 ...
start "" http://localhost:3000
%NODE_CMD% "%~dp0server.js"
pause
