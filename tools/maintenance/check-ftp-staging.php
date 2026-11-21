<?php
declare(strict_types=1);

// Read-only readiness probe. Credentials are read from a private local file, never argv.
$projectRoot = dirname(__DIR__, 2);
$configurationPath = getenv('RYLVA_DEPLOYMENT_CONFIG') ?: $projectRoot . '/config/deployment.local.json';
$reportDirectory = $projectRoot . '/storage/reports/staging';
$report = ['connected' => false, 'uploaded' => false, 'requiredFields' => [], 'pendingLayout' => []];
$exitCode = 1;
try
{
  if (!is_file($configurationPath))
  {
    throw new RuntimeException('Fill config/deployment.local.json using the non-secret example.');
  }
  $json = file_get_contents($configurationPath);
  if (str_starts_with($json, "\xEF\xBB\xBF"))
  {
    $json = substr($json, 3);
  }
  $configuration = json_decode($json, true, 32, JSON_THROW_ON_ERROR);
  foreach (['ftp.host', 'ftp.username', 'ftp.password'] as $field)
  {
    [$section, $key] = array_pad(explode('.', $field, 2), 2, null);
    $value = $key === null ? ($configuration[$section] ?? null) : ($configuration[$section][$key] ?? null);
    if (!is_string($value) || trim($value) === '')
    {
      $report['requiredFields'][] = $field;
    }
    elseif (strpbrk($value, "\r\n") !== false)
    {
      throw new RuntimeException('A deployment field contains an invalid newline.');
    }
  }
  if ($report['requiredFields'] !== [])
  {
    throw new RuntimeException('Hosting access configuration is incomplete; no connection or upload was attempted.');
  }
  $ftp = $configuration['ftp'];
  $protocol = $ftp['protocol'] ?? '';
  if (!in_array($protocol, ['ftp', 'ftps', 'sftp'], true) || !extension_loaded('curl'))
  {
    throw new RuntimeException('This readiness probe requires PHP cURL and a supported FTP/FTPS/SFTP protocol.');
  }
  if (!preg_match('/^[A-Za-z0-9.-]+$/', $ftp['host']) || !is_int($ftp['port'] ?? null)
    || $ftp['port'] < 1 || $ftp['port'] > 65535)
  {
    throw new RuntimeException('Invalid FTP hostname or port.');
  }
  $stagingAddress = $configuration['stagingUrl'] ?? '';
  if ($stagingAddress === '' && ($configuration['domain'] ?? '') === 'rylvagreen.biz.id')
  {
    // The user explicitly chose this main domain for staging.
    $stagingAddress = 'https://rylvagreen.biz.id';
  }
  $stagingUrl = parse_url($stagingAddress);
  if (!is_array($stagingUrl) || ($stagingUrl['scheme'] ?? '') !== 'https' || !isset($stagingUrl['host'])
    || isset($stagingUrl['user']) || isset($stagingUrl['pass']))
  {
    throw new RuntimeException('Supply the intended HTTPS staging URL without credentials.');
  }
  foreach (['publicRoot', 'privateRoot'] as $field)
  {
    $path = $configuration['paths'][$field] ?? '';
    if ($path === '')
    {
      $report['pendingLayout'][] = 'paths.' . $field;
      continue;
    }
    if (!is_string($path) || !str_starts_with($path, '/') || preg_match('~[\r\n\\\\]|(?:^|/)\.\.(?:/|$)~', $path))
    {
      throw new RuntimeException('Use absolute FTP paths without traversal segments.');
    }
  }
  $publicRoot = rtrim($configuration['paths']['publicRoot'] ?? '', '/');
  $privateRoot = rtrim($configuration['paths']['privateRoot'] ?? '', '/');
  if ($report['pendingLayout'] === []
    && ($privateRoot === $publicRoot || str_starts_with($privateRoot, $publicRoot . '/')))
  {
    throw new RuntimeException('The private application directory must be outside the public document root.');
  }
  $transferPath = '/';
  if ($protocol === 'sftp')
  {
    $transferPath = ($configuration['paths']['privateRoot'] ?? '') ?: '/~/';
    $transferPath = rtrim(implode('/', array_map('rawurlencode', explode('/', $transferPath))), '/') . '/';
  }
  $scheme = $protocol === 'sftp' ? 'sftp' : 'ftp';
  $options = [
    CURLOPT_USERNAME => $ftp['username'], CURLOPT_PASSWORD => $ftp['password'],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_DIRLISTONLY => true,
    CURLOPT_CONNECTTIMEOUT => 15, CURLOPT_TIMEOUT => 30,
  ];
  if ($protocol === 'sftp')
  {
    $knownHosts = $ftp['knownHostsFile'] ?? ($projectRoot . '/storage/cache/staging-ssh/known_hosts');
    if (!is_string($knownHosts) || !is_file($knownHosts))
    {
      throw new RuntimeException('No pinned SSH hosts file is available; verify the server key before connecting.');
    }
    if (!in_array('sftp', curl_version()['protocols'], true))
    {
      throw new RuntimeException('This PHP cURL runtime does not support SFTP.');
    }
    $options[CURLOPT_SSH_KNOWNHOSTS] = $knownHosts;
    $options[CURLOPT_SSH_AUTH_TYPES] = CURLSSH_AUTH_PASSWORD;
  }
  elseif ($protocol === 'ftps')
  {
    $options[CURLOPT_USE_SSL] = CURLUSESSL_ALL;
    $options[CURLOPT_FTPSSLAUTH] = CURLFTPAUTH_TLS;
    $options[CURLOPT_SSL_VERIFYPEER] = true;
    $options[CURLOPT_SSL_VERIFYHOST] = 2;
  }
  $connection = curl_init($scheme . '://' . $ftp['host'] . ':' . $ftp['port'] . $transferPath);
  curl_setopt_array($connection, $options);
  $listing = curl_exec($connection);
  $errorNumber = curl_errno($connection);
  curl_close($connection);
  if ($listing === false)
  {
    $report['transportErrorNumber'] = $errorNumber;
    $report['protocol'] = $protocol;
    throw new RuntimeException('The transfer readiness check failed (' . curl_strerror($errorNumber)
      . '). Inspect the secure transport and account access; no files were uploaded.');
  }
  $report['connected'] = true;
  $report['listingEntryCount'] = count(array_filter(preg_split('/\r?\n/', trim($listing))));
  $report['protocol'] = $protocol;
  $report['serverKeyVerified'] = $protocol !== 'ftp';
  $report['encrypted'] = $protocol !== 'ftp';
  $report['message'] = 'Read-only connection succeeded. Remote directories and deployment layout still require inspection before upload.';
  $exitCode = 0;
}
catch (Throwable $error)
{
  $report['message'] = $error instanceof JsonException ? 'The private deployment JSON is invalid.' : $error->getMessage();
}
if (!is_dir($reportDirectory))
{
  mkdir($reportDirectory, 0700, true);
}
file_put_contents($reportDirectory . '/ftp-readiness.json', json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
echo json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
exit($exitCode);
