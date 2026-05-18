@echo off
title NexusPro - Sistema Empresarial Inteligente

cls
echo.
echo  =================================================================
echo   NexusPro -- Sistema Empresarial Inteligente v2.0
echo.
echo   Modulos:
echo   - Dashboard com IA e graficos avancados
echo   - CRM completo com gestao de clientes
echo   - Financeiro (entradas, saidas, DRE)
echo   - WhatsApp real (via Baileys, sem API oficial)
echo   - Chat com IA (Claude ou OpenAI)
echo   - Pipeline Kanban de vendas
echo   - Agenda de vencimentos
echo   - Relatorios PDF e Excel
echo   - Login multi-usuario com perfis
echo   - Notificacoes em tempo real
echo  =================================================================
echo.
echo   Login padrao: admin@nexuspro.com / nexus123
echo.

node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] Node.js nao encontrado!
    echo  [INFO] Baixe em: https://nodejs.org  (versao 18 ou superior)
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>nul') do set NV=%%v
echo  [OK] Node.js %NV%

npm --version > nul 2>&1
if %errorlevel% neq 0 ( echo  [ERRO] npm nao encontrado. & pause & exit /b 1 )

if not exist "node_modules\" (
    echo.
    echo  [>>] Instalando dependencias (aguarde 3-5 minutos)...
    npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo  [ERRO] Falha! Tente: npm install --legacy-peer-deps --force
        pause & exit /b 1
    )
    echo  [OK] Dependencias instaladas!
    echo.
)

if not exist "dist\" (
    echo  [>>] Compilando frontend React...
    npm run build
    if %errorlevel% neq 0 ( echo  [ERRO] Build falhou! & pause & exit /b 1 )
    echo  [OK] Frontend compilado!
    echo.
)

if not exist "data\"      mkdir data
if not exist "uploads\"   mkdir uploads
if not exist "auth_info\" mkdir auth_info

netstat -ano | find ":3001 " | find "LISTENING" > nul 2>&1
if %errorlevel% equ 0 (
    echo  [!] Liberando porta 3001...
    for /f "tokens=5" %%p in ('netstat -ano ^| find ":3001 " ^| find "LISTENING"') do (
        taskkill /PID %%p /F > nul 2>&1
    )
    timeout /t 2 /nobreak > nul
)

echo.
echo  =================================================================
echo   Dashboard: http://localhost:3001
echo   API:       http://localhost:3001/api
echo   Login:     admin@nexuspro.com / nexus123
echo.
echo   WhatsApp: acesse o modulo WhatsApp e clique em "Conectar"
echo   IA:       configure sua chave API em Configuracoes
echo.
echo   Para sair: CTRL+C
echo  =================================================================
echo.

rem Aguarda o servidor iniciar e abre o navegador
start /B cmd /C "timeout /t 5 /nobreak > nul && powershell -Command start 'http://localhost:3001'"

echo  [>>] Iniciando servidor...
node server.js

echo.
echo  =================================================================
echo   NexusPro encerrado.
echo  =================================================================
pause
