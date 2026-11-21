param(
  [string] $mysqlBinPath = 'C:/laragon/bin/mysql/mysql-8.4.3-winx64/bin',
  [int] $port = 13367
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$runtimePath = Join-Path $projectRoot 'storage/cache/foundation-mysql'
$dataPath = Join-Path $runtimePath 'data'
$serverConfigPath = Join-Path $runtimePath 'server.ini'
$adminConfigPath = Join-Path $runtimePath 'admin.ini'
$testingEnvPath = Join-Path $projectRoot 'config/.env.testing'
$bootstrapStatePath = Join-Path $runtimePath 'bootstrap-state.json'
$setupCredentialsPath = Join-Path $runtimePath 'setup-credentials.json'
$mysqldPath = Join-Path $mysqlBinPath 'mysqld.exe'
$mysqlPath = Join-Path $mysqlBinPath 'mysql.exe'
$mysqlAdminPath = Join-Path $mysqlBinPath 'mysqladmin.exe'
$databaseName = 'rylva_green_m0_test'
$memoryArguments = @('--no-defaults', '--protocol=MEMORY', '--shared-memory-base-name=RylvaGreenM0', '--host=localhost', '--user=root')

function Get-AdminArguments
{
  if (Test-Path -LiteralPath $adminConfigPath)
  {
    & $mysqlPath "--defaults-file=$adminConfigPath" --batch --skip-column-names -e 'SELECT 1' 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0)
    {
      return @("--defaults-file=$adminConfigPath")
    }
  }
  if ($pendingSetup)
  {
    & $mysqlPath @memoryArguments --batch --skip-column-names -e 'SELECT 1' 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0)
    {
      return $memoryArguments
    }
  }
  throw 'The isolated administrator credentials could not be verified. Nothing was reset.'
}

function Assert-IsolatedServer
{
  param([string[]] $adminArguments)

  $identity = & $mysqlPath @adminArguments --batch --skip-column-names -e 'SELECT @@datadir, @@port' 2>$null
  if ($LASTEXITCODE -ne 0 -or !$identity)
  {
    throw 'The database identity could not be verified.'
  }
  $parts = $identity.Trim() -split "\t"
  $expectedPath = [System.IO.Path]::GetFullPath($dataPath).TrimEnd('\', '/')
  $actualPath = [System.IO.Path]::GetFullPath($parts[0]).TrimEnd('\', '/')
  if ($parts.Length -ne 2 -or $actualPath -ne $expectedPath -or [int] $parts[1] -ne $port)
  {
    throw 'The listener does not belong to this isolated workspace database. Nothing was changed.'
  }
}

foreach ($binaryPath in @($mysqldPath, $mysqlPath, $mysqlAdminPath))
{
  if (!(Test-Path -LiteralPath $binaryPath))
  {
    throw 'MySQL binaries were not found. Pass -mysqlBinPath to the installed MySQL bin directory.'
  }
}
if ($port -lt 1024 -or $port -gt 65535)
{
  throw 'The isolated database port must be between 1024 and 65535.'
}

New-Item -ItemType Directory -Path $runtimePath -Force | Out-Null
$pendingSetup = (Test-Path -LiteralPath $bootstrapStatePath) -and (
  (Get-Content -LiteralPath $bootstrapStatePath -Raw | ConvertFrom-Json).phase -eq 'pendingSetup'
)
$existingListener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
$needsAccountSetup = $pendingSetup
if ($existingListener)
{
  $adminArguments = @(Get-AdminArguments)
  Assert-IsolatedServer -adminArguments $adminArguments
  if (!$pendingSetup)
  {
    if (!(Test-Path -LiteralPath $testingEnvPath))
    {
      throw 'The test environment file is missing. Existing data was preserved.'
    }
    Write-Output "Isolated MySQL is already running on 127.0.0.1:$port. Existing data was preserved."
    exit 0
  }
}
else
{
  $mysqlBasePath = [System.IO.Path]::GetFullPath((Join-Path $mysqlBinPath '..')).Replace('\', '/')
  $mysqlDataPath = $dataPath.Replace('\', '/')
  $mysqlLogPath = (Join-Path $runtimePath 'mysql-error.log').Replace('\', '/')
  Set-Content -LiteralPath $serverConfigPath -Encoding utf8 -Value @"
[mysqld]
basedir=$mysqlBasePath
datadir=$mysqlDataPath
port=$port
bind-address=127.0.0.1
mysqlx=OFF
skip-log-bin
shared-memory=ON
shared-memory-base-name=RylvaGreenM0
skip-name-resolve=ON
local-infile=OFF
secure-file-priv=NULL
innodb-buffer-pool-size=67108864
log-error=$mysqlLogPath
"@

  $isNewDatabase = !(Test-Path -LiteralPath (Join-Path $dataPath 'mysql'))
  $needsAccountSetup = $isNewDatabase -or $pendingSetup
  if ($isNewDatabase)
  {
    if ((Test-Path -LiteralPath $dataPath) -and (Get-ChildItem -LiteralPath $dataPath -Force | Select-Object -First 1))
    {
      throw 'The data directory is not empty and is not an initialized workspace database. Nothing was removed.'
    }
    if ((Test-Path -LiteralPath $testingEnvPath) -or (Test-Path -LiteralPath $adminConfigPath))
    {
      throw 'Existing test credentials were found without a matching initialized database. Nothing was overwritten.'
    }
    Set-Content -LiteralPath $bootstrapStatePath -Encoding utf8 -Value '{"phase":"pendingSetup"}'
    $pendingSetup = $true
    & $mysqldPath "--defaults-file=$serverConfigPath" --initialize-insecure
    if ($LASTEXITCODE -ne 0)
    {
      throw "MySQL initialization failed. Inspect $mysqlLogPath."
    }
  }
  elseif (!$pendingSetup -and (!(Test-Path -LiteralPath $adminConfigPath) -or !(Test-Path -LiteralPath $testingEnvPath)))
  {
    throw 'The initialized database has no matching test credentials. Nothing was reinitialized.'
  }

  $serverProcess = Start-Process -FilePath $mysqldPath -ArgumentList "--defaults-file=$serverConfigPath" -WindowStyle Hidden -PassThru
  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++)
  {
    Start-Sleep -Milliseconds 500
    if ($serverProcess.HasExited)
    {
      throw "The isolated MySQL process exited. Inspect $mysqlLogPath."
    }
    & $mysqlAdminPath @memoryArguments --connect-timeout=1 ping --silent *> $null
    if ($LASTEXITCODE -eq 0)
    {
      $ready = $true
      break
    }
  }
  if (!$ready)
  {
    throw "The isolated MySQL process did not become ready. Inspect $mysqlLogPath."
  }
  $adminArguments = @(Get-AdminArguments)
  Assert-IsolatedServer -adminArguments $adminArguments
}

if ($needsAccountSetup)
{
  if (Test-Path -LiteralPath $setupCredentialsPath)
  {
    $credentials = Get-Content -LiteralPath $setupCredentialsPath -Raw | ConvertFrom-Json
  }
  elseif ((Test-Path -LiteralPath $adminConfigPath) -and (Test-Path -LiteralPath $testingEnvPath))
  {
    $adminMatch = [regex]::Match((Get-Content -LiteralPath $adminConfigPath -Raw), '(?m)^password=([a-f0-9]{48})\r?$')
    $databaseMatch = [regex]::Match((Get-Content -LiteralPath $testingEnvPath -Raw), '(?m)^DB_PASSWORD=([a-f0-9]{48})\r?$')
    $credentials = @{
      adminPassword = $adminMatch.Groups[1].Value
      databasePassword = $databaseMatch.Groups[1].Value
    }
  }
  else
  {
    if ((Test-Path -LiteralPath $adminConfigPath) -or (Test-Path -LiteralPath $testingEnvPath))
    {
      throw 'Only part of the bootstrap credentials is present. Inspect the private runtime; nothing was overwritten.'
    }
    $credentials = @{
      adminPassword = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24)).ToLowerInvariant()
      databasePassword = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24)).ToLowerInvariant()
    }
  }
  foreach ($credential in @($credentials.adminPassword, $credentials.databasePassword))
  {
    if ($credential -notmatch '^[a-f0-9]{48}$')
    {
      throw 'Bootstrap credentials are incomplete. No SQL changes were made.'
    }
  }

  # Persist both secrets before changing accounts so a retry can reuse the same credentials.
  Set-Content -LiteralPath $setupCredentialsPath -Encoding utf8 -Value ($credentials | ConvertTo-Json)
  if (!(Test-Path -LiteralPath $adminConfigPath))
  {
    Set-Content -LiteralPath $adminConfigPath -Encoding utf8 -Value @"
[client]
host=localhost
port=$port
user=root
password=$($credentials.adminPassword)
protocol=MEMORY
shared-memory-base-name=RylvaGreenM0
"@
  }
  if (!(Test-Path -LiteralPath $testingEnvPath))
  {
    Set-Content -LiteralPath $testingEnvPath -Encoding utf8 -Value @"
APP_ENV=testing
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_BASE_URL=http://127.0.0.1:4186
DB_HOST=127.0.0.1
DB_PORT=$port
DB_NAME=$databaseName
DB_USER=rylva_m0
DB_PASSWORD=$($credentials.databasePassword)
MYSQL_CLIENT_BIN=$($mysqlPath.Replace('\', '/'))
"@
  }
  $setupSql = @"
CREATE DATABASE IF NOT EXISTS $databaseName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'rylva_m0'@'127.0.0.1' IDENTIFIED BY '$($credentials.databasePassword)';
ALTER USER 'rylva_m0'@'127.0.0.1' IDENTIFIED BY '$($credentials.databasePassword)';
GRANT ALL PRIVILEGES ON $databaseName.* TO 'rylva_m0'@'127.0.0.1';
ALTER USER 'root'@'localhost' IDENTIFIED BY '$($credentials.adminPassword)';
"@
  $setupSql | & $mysqlPath @adminArguments
  if ($LASTEXITCODE -ne 0)
  {
    throw 'Isolated database account setup failed. Re-run this command to resume; credentials were not printed.'
  }
  Set-Content -LiteralPath $bootstrapStatePath -Encoding utf8 -Value '{"phase":"ready"}'
}

if (!$existingListener)
{
  Set-Content -LiteralPath (Join-Path $runtimePath 'process.json') -Encoding utf8 -Value (
    @{ processId = $serverProcess.Id; port = $port; dataPath = $dataPath } | ConvertTo-Json
  )
}
Write-Output "Isolated MySQL is ready on 127.0.0.1:$port; database $databaseName. Test credentials are stored in ignored local files."
