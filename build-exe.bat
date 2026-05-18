@echo off
title NexusPro - Build EXE

cls
echo.
echo  =================================================================
echo   NexusPro -- Gerador de .EXE
echo  =================================================================
echo.
echo  [1] Instalador profissional  ^>  dist-electron\NexusPro-Setup-2.0.0.exe
echo      Wizard de instalacao, atalhos no Desktop/Menu Iniciar e app completo
echo.
echo  [2] Servidor PKG portavel ^>  dist-exe\nexuspro.exe  (~60MB)
echo      Abre no browser, mais leve, copiar dist\ junto
echo.
echo  [3] Ambos
echo  [0] Cancelar
echo.
set /p CH=  Opcao: 

if "%CH%"=="0" goto END
if "%CH%"=="1" goto ELECTRON
if "%CH%"=="2" goto PKG
if "%CH%"=="3" ( call :EL & call :PK & goto SUCCESS )
echo  Opcao invalida. & pause & exit /b 1

:ELECTRON
call :EL & goto SUCCESS
:PKG
call :PK & goto SUCCESS

:EL
echo.
echo  [Electron] Compilando frontend...
call npm run build
if %errorlevel% neq 0 ( echo  [ERRO] Build falhou! & exit /b 1 )
echo  [Electron] Verificando electron-builder...
npx electron-builder --version > nul 2>&1
if %errorlevel% neq 0 ( call npm install --save-dev electron electron-builder --legacy-peer-deps --silent )
echo  [Electron] Gerando instalador profissional...
npx electron-builder --win nsis --x64
if %errorlevel% neq 0 ( echo  [ERRO] Build falhou! & exit /b 1 )
echo  [OK] Instalador gerado em dist-electron\NexusPro-Setup-2.0.0.exe
goto :EOF

:PK
echo.
echo  [PKG] Instalando pkg...
call npm install -g pkg --silent
echo  [PKG] Compilando frontend...
call npm run build
if %errorlevel% neq 0 ( echo  [ERRO] Build falhou! & exit /b 1 )
if not exist "dist-exe\" mkdir dist-exe
echo  [PKG] Empacotando servidor...
pkg server.js --targets node18-win-x64 --output dist-exe\nexuspro.exe --compress GZip
if %errorlevel% neq 0 ( echo  [ERRO] PKG falhou! & exit /b 1 )
echo  [OK] dist-exe\nexuspro.exe gerado!
echo  IMPORTANTE: copie a pasta dist\ e data\ junto com o .exe
goto :EOF

:SUCCESS
echo.
echo  =================================================================
echo   Build concluido com sucesso!
echo  =================================================================
:END
pause
