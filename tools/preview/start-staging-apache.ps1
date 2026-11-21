param(
  [string] $apacheRoot = 'C:/laragon/bin/apache/httpd-2.4.69-261002-Win64-VS18',
  [string] $phpRoot = 'C:/laragon/bin/php/php-8.3.36-Win32-vs16-x64',
  [int] $port = 4187,
  [string] $envFile = ''
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..')).Replace('\', '/')
$runtimeRoot = $projectRoot + '/storage/cache/apache-staging'
$httpdPath = Join-Path $apacheRoot 'bin/httpd.exe'
$passwordToolPath = Join-Path $apacheRoot 'bin/htpasswd.exe'
$configurationPath = $runtimeRoot + '/httpd.conf'
$credentialsPath = $runtimeRoot + '/review-credentials.json'
$processPath = $runtimeRoot + '/process.json'
if ($envFile -eq '')
{
  $envFile = $projectRoot + '/config/.env.testing'
}
if ($port -lt 1024 -or $port -gt 65535)
{
  throw 'Use a valid unprivileged staging verification port.'
}
foreach ($requiredFile in @($httpdPath, $passwordToolPath, ($phpRoot + '/php8apache2_4.dll'), $envFile))
{
  if (!(Test-Path -LiteralPath $requiredFile))
  {
    throw 'A required Apache/PHP/configuration file is missing. Supply the matching installed paths.'
  }
}
$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listener)
{
  if (!(Test-Path -LiteralPath $processPath) -or !(Test-Path -LiteralPath $credentialsPath))
  {
    throw 'The staging port is occupied by an unrecognized process. Nothing was stopped.'
  }
  $record = Get-Content -LiteralPath $processPath -Raw | ConvertFrom-Json
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($record.processId)"
  if (!$process -or $record.port -ne $port -or $process.CommandLine -notlike "*$configurationPath*")
  {
    throw 'The running staging process does not match this workspace instance.'
  }
  Write-Output "Protected Apache staging verification is already running on http://127.0.0.1:$port."
  exit 0
}

New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
$authFile = $runtimeRoot + '/.htpasswd'
if (!(Test-Path -LiteralPath $credentialsPath))
{
  if (Test-Path -LiteralPath $authFile)
  {
    throw 'An authentication file exists without matching review credentials; nothing was overwritten.'
  }
  $reviewPassword = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24)).ToLowerInvariant()
  @{ user = 'reviewer'; password = $reviewPassword; baseUrl = "http://127.0.0.1:$port" } |
    ConvertTo-Json | Set-Content -LiteralPath $credentialsPath -Encoding utf8
}
if (!(Test-Path -LiteralPath $authFile))
{
  $credentials = Get-Content -LiteralPath $credentialsPath -Raw | ConvertFrom-Json
  $passwordHash = $credentials.password | & $passwordToolPath -niB -C 12 $credentials.user
  if ($LASTEXITCODE -ne 0)
  {
    throw 'Unable to create private Apache review authentication.'
  }
  Set-Content -LiteralPath $authFile -Value $passwordHash -Encoding ascii
}
$credentials = Get-Content -LiteralPath $credentialsPath -Raw | ConvertFrom-Json
if ($credentials.baseUrl -ne "http://127.0.0.1:$port")
{
  $credentials.baseUrl = "http://127.0.0.1:$port"
  $credentials | ConvertTo-Json | Set-Content -LiteralPath $credentialsPath -Encoding utf8
}
$configuration = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'apache-staging.conf.template') -Raw
$replacements = @{
  apacheRoot = [System.IO.Path]::GetFullPath($apacheRoot).Replace('\', '/')
  phpRoot = [System.IO.Path]::GetFullPath($phpRoot).Replace('\', '/')
  projectRoot = $projectRoot
  runtimeRoot = $runtimeRoot
  envFile = (Resolve-Path -LiteralPath $envFile).Path.Replace('\', '/')
  port = [string] $port
}
foreach ($entry in $replacements.GetEnumerator())
{
  if ($entry.Value -match '[\r\n"]')
  {
    throw 'Invalid Apache configuration path.'
  }
  $configuration = $configuration.Replace('{{' + $entry.Key + '}}', $entry.Value)
}
Set-Content -LiteralPath $configurationPath -Value $configuration -Encoding ascii
& $httpdPath -t -f $configurationPath
if ($LASTEXITCODE -ne 0)
{
  throw 'Apache configuration validation failed; the server was not started.'
}
$serverProcess = Start-Process -FilePath $httpdPath -ArgumentList @('-f', $configurationPath, '-DFOREGROUND') -WindowStyle Hidden -PassThru
@{ processId = $serverProcess.Id; port = $port; configurationPath = $configurationPath } |
  ConvertTo-Json | Set-Content -LiteralPath $processPath -Encoding utf8
$ready = $false
for ($attempt = 0; $attempt -lt 40; $attempt++)
{
  Start-Sleep -Milliseconds 250
  if ($serverProcess.HasExited)
  {
    throw 'Apache exited; inspect the private staging runtime logs.'
  }
  try
  {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -SkipHttpErrorCheck -TimeoutSec 1
    if ([int] $response.StatusCode -eq 401)
    {
      $ready = $true
      break
    }
  }
  catch
  {
    # Readiness only; no credentials or request data is logged.
  }
}
if (!$ready)
{
  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $($serverProcess.Id)" |
    Where-Object { $_.Name -eq 'httpd.exe' }
  foreach ($child in $children)
  {
    Stop-Process -Id $child.ProcessId -ErrorAction SilentlyContinue
  }
  Stop-Process -Id $serverProcess.Id -ErrorAction SilentlyContinue
  throw 'Apache did not become ready with review authentication enabled.'
}
Write-Output "Protected Apache staging verification is ready on http://127.0.0.1:$port. Credentials remain in the ignored private runtime."
