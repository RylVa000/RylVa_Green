param(
  [string] $phpPath = 'C:/laragon/bin/php/php-8.3.36-Win32-vs16-x64/php.exe',
  [string] $envFile = '',
  [int] $port = 4186
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
if ($envFile -eq '')
{
  $envFile = Join-Path $projectRoot 'config/.env.testing'
}
if (!(Test-Path -LiteralPath $phpPath))
{
  throw 'PHP was not found. Pass -phpPath to a PHP 8.2+ executable.'
}
if (!(Test-Path -LiteralPath $envFile))
{
  throw 'Testing configuration is missing. Run tools/testing/start-foundation-mysql.ps1 first.'
}
if ($port -lt 1024 -or $port -gt 65535)
{
  throw 'Use a valid development port between 1024 and 65535.'
}
$env:RYLVA_ENV_FILE = (Resolve-Path -LiteralPath $envFile).Path
$logDirectory = Join-Path $projectRoot 'storage/logs/development'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$logFile = Join-Path $logDirectory 'php-foundation.log'
Write-Output "PHP application: http://127.0.0.1:$port ; configuration stays outside public/."
& $phpPath -d display_errors=0 -d expose_php=0 -d log_errors=1 -d "error_log=$logFile" -S "127.0.0.1:$port" -t (Join-Path $projectRoot 'public') (Join-Path $PSScriptRoot 'router.php')
exit $LASTEXITCODE
