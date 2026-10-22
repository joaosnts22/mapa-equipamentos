@echo off
setlocal

rem Inicia o mapa na porta 8000, acessivel pela rede local.
rem Usa o Python do PATH (ou ajuste PYTHON_EXE para o Python do servidor).

set "PROJECT_DIR=%~dp0"
set "APP_DIR=%PROJECT_DIR%backend\app"
set "LOG_DIR=%PROJECT_DIR%backend\logs"
set "PYTHON_EXE=python"

if not exist "%LOG_DIR%" (
    mkdir "%LOG_DIR%"
)

netstat -ano | findstr /R /C:":8000 .*LISTENING" >nul

if not errorlevel 1 (
    echo [%date% %time%] Servidor ja ativo na porta 8000. >> "%LOG_DIR%\inicializacao.log"
    exit /b 0
)

cd /d "%APP_DIR%"

echo [%date% %time%] Iniciando o mapa. >> "%LOG_DIR%\inicializacao.log"

"%PYTHON_EXE%" -m uvicorn main:app --host 0.0.0.0 --port 8000 >> "%LOG_DIR%\uvicorn.log" 2>&1

set "EXIT_CODE=%ERRORLEVEL%"

echo [%date% %time%] Servidor encerrado. Codigo: %EXIT_CODE%. >> "%LOG_DIR%\inicializacao.log"

exit /b %EXIT_CODE%
