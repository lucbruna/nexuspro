Write-Host ""
Write-Host " ================================================================="
Write-Host "  NexusPro -- Sistema Empresarial Inteligente v2.0" -ForegroundColor Cyan
Write-Host " ================================================================="
Write-Host ""
Write-Host "  Login padrao: admin@nexuspro.com / nexus123"
Write-Host ""

# Check Node.js
try { $nv = node --version } catch {
    Write-Host " [ERRO] Node.js nao encontrado!" -ForegroundColor Red
    Write-Host " [INFO] Baixe em: https://nodejs.org  (versao 18 ou superior)"
    Read-Host "Pressione Enter para sair"; exit 1
}
Write-Host " [OK] Node.js $nv" -ForegroundColor Green

# Check npm
try { npm --version | Out-Null } catch {
    Write-Host " [ERRO] npm nao encontrado." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"; exit 1
}

# Install deps
if (-not (Test-Path "node_modules")) {
    Write-Host "`n [>>] Instalando dependencias (aguarde 3-5 minutos)..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host " [ERRO] Falha! Tente: npm install --legacy-peer-deps --force" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"; exit 1
    }
    Write-Host " [OK] Dependencias instaladas!" -ForegroundColor Green
}

# Build frontend
if (-not (Test-Path "dist")) {
    Write-Host "`n [>>] Compilando frontend React..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host " [ERRO] Build falhou!" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"; exit 1
    }
    Write-Host " [OK] Frontend compilado!" -ForegroundColor Green
}

# Create dirs
@("data", "uploads", "auth_info") | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ | Out-Null }
}

# Kill process on port 3001
$existing = netstat -ano | Select-String ":3001 " | Select-String "LISTENING"
if ($existing) {
    Write-Host " [!] Liberando porta 3001..." -ForegroundColor Yellow
    $existing -replace '.*\s+(\d+)$', '$1' | ForEach-Object {
        taskkill /PID $_ /F 2>$null
    }
    Start-Sleep 2
}

Write-Host ""
Write-Host " ================================================================="
Write-Host "  Dashboard: http://localhost:3001"
Write-Host "  API:       http://localhost:3001/api"
Write-Host "  Login:     admin@nexuspro.com / nexus123"
Write-Host ""
Write-Host "  WhatsApp: acesse o modulo WhatsApp e clique em 'Conectar'"
Write-Host "  IA:       configure sua chave API em Configuracoes"
Write-Host ""
Write-Host "  Para sair: CTRL+C"
Write-Host " ================================================================="
Write-Host ""

# Open browser after 5 seconds
$url = "http://localhost:3001"
$timer = [System.Threading.Timer]::new({ Start-Process $url }, $null, 5000, -1)

Write-Host " [>>] Iniciando servidor..." -ForegroundColor Yellow
node server.js

Write-Host ""
Write-Host " ================================================================="
Write-Host "  NexusPro encerrado."
Write-Host " ================================================================="
Read-Host "Pressione Enter para sair"
