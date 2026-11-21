<?php
declare(strict_types=1);

// Builds an immutable local transfer plan. No remote server code is installed or executed here.
$projectRoot = dirname(__DIR__, 2);
require $projectRoot . '/vendor/autoload.php';
$configuration = json_decode(file_get_contents($projectRoot . '/config/deployment.local.json'), true, 32, JSON_THROW_ON_ERROR);
$package = json_decode(file_get_contents($projectRoot . '/storage/reports/staging/package.json'), true, 32, JSON_THROW_ON_ERROR);
if (hash_file('sha256', $package['archive']) !== $package['sha256'])
{
  throw new RuntimeException('The staging package checksum differs from its manifest.');
}
$archive = new PharData($package['archive']);
$manifest = json_decode($archive['release-manifest.json']->getContent(), true, 32, JSON_THROW_ON_ERROR);
$releaseId = $manifest['releaseId'];
if (!preg_match('/^[0-9]{8}_[0-9]{6}_[a-f0-9]{8}$/', $releaseId))
{
  throw new RuntimeException('Invalid staging release identifier.');
}
$localRoot = $projectRoot . '/storage/cache/ftp-release-' . $releaseId;
$privateFtpRoot = '/_rylva_green_private/releases/' . $releaseId;
$publicFtpRoot = '/' . $configuration['domain'];
$files = [];
$writeFile = static function (string $relative, string $content, string $remotePath, string $area) use ($localRoot, &$files): void
{
  $path = $localRoot . '/' . $relative;
  if (!is_dir(dirname($path)))
  {
    mkdir(dirname($path), 0700, true);
  }
  file_put_contents($path, $content);
  $files[] = ['local' => $path, 'remote' => $remotePath, 'sha256' => hash('sha256', $content), 'area' => $area];
};
foreach ($manifest['files'] as $relative => $expectedHash)
{
  if (str_starts_with($relative, '/') || preg_match('~(?:^|/)\.\.(?:/|$)|[\r\n\\\\]~', $relative))
  {
    throw new RuntimeException('Unsafe archive entry.');
  }
  $content = $archive[$relative]->getContent();
  if (hash('sha256', $content) !== $expectedHash)
  {
    throw new RuntimeException('An archive entry failed integrity verification.');
  }
  if (str_starts_with($relative, 'public/assets/'))
  {
    $publicRelative = substr($relative, 7);
    $writeFile('web/' . $publicRelative, $content, $publicFtpRoot . '/' . $publicRelative, 'assets');
  }
  elseif (!str_starts_with($relative, 'public/') || str_ends_with($relative, '.html') || $relative === 'public/index.php')
  {
    $writeFile('private/' . $relative, $content, $privateFtpRoot . '/' . $relative, 'private');
  }
}
$database = $configuration['database'];
$environment = [
  'APP_ENV' => 'staging', 'APP_DEBUG' => 'false', 'APP_TIMEZONE' => 'UTC',
  'APP_BASE_URL' => $configuration['stagingUrl'],
  'DB_HOST' => $database['host'], 'DB_PORT' => (string) $database['port'],
  'DB_NAME' => $database['name'], 'DB_USER' => $database['username'], 'DB_PASSWORD' => $database['password'],
  'PAYMENT_PROVIDER' => 'unconfigured', 'COURIER_PROVIDER' => 'unconfigured',
];
$lines = [];
foreach ($environment as $key => $value)
{
  if (!is_string($value) || strpbrk($value, "\r\n") !== false)
  {
    throw new RuntimeException('Invalid deployment environment field: ' . $key);
  }
  putenv($key);
  $lines[] = $key . '="' . $value . '"';
}
$writeFile('private/config/.env', implode("\n", $lines) . "\n", $privateFtpRoot . '/config/.env', 'private');
RylvaGreen\Config\AppConfig::boot($localRoot . '/private/config/.env');

$credentialPath = $projectRoot . '/config/staging-review.local.json';
if (is_file($credentialPath))
{
  $credentials = json_decode(file_get_contents($credentialPath), true, 32, JSON_THROW_ON_ERROR);
}
else
{
  $credentials = ['user' => 'reviewer', 'password' => bin2hex(random_bytes(24)), 'baseUrl' => $configuration['stagingUrl']];
  file_put_contents($credentialPath, json_encode($credentials, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
  chmod($credentialPath, 0600);
}
$access = ['username' => $credentials['user'], 'passwordHash' => password_hash($credentials['password'], PASSWORD_BCRYPT, ['cost' => 12])];
$writeFile('private/config/staging-access.php', "<?php\nreturn " . var_export($access, true) . ";\n",
  $privateFtpRoot . '/config/staging-access.php', 'private');
$writeFile('private/storage/logs/.gitkeep', '', $privateFtpRoot . '/storage/logs/.gitkeep', 'private');
$writeFile('private/manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR),
  $privateFtpRoot . '/manifest.json', 'private');
$writeFile('private-deny.htaccess', "Require all denied\n", '/_rylva_green_private/.htaccess', 'guard');
$gateway = str_replace('__RYLVA_RELEASE_ID__', $releaseId,
  file_get_contents($projectRoot . '/deploy/php/ftp-front-controller.php'));
$writeFile('web/index.php', $gateway, $publicFtpRoot . '/index.php', 'gateway');
$writeFile('web/.htaccess', file_get_contents($projectRoot . '/deploy/apache/ftp-staging.htaccess'),
  $publicFtpRoot . '/.htaccess', 'gateway');
$writeFile('web/.user.ini', file_get_contents($projectRoot . '/deploy/php/ftp-staging.user.ini'),
  $publicFtpRoot . '/.user.ini', 'gateway');
$plan = [
  'releaseId' => $releaseId, 'privateFtpRoot' => $privateFtpRoot, 'publicFtpRoot' => $publicFtpRoot,
  'localRoot' => $localRoot, 'sourceArchiveSha256' => $package['sha256'], 'files' => $files,
  'reviewCredentialFile' => $credentialPath,
  'publicHtmlFiles' => 0, 'databaseOperations' => 0,
];
file_put_contents($projectRoot . '/storage/reports/staging/ftp-plan.json', json_encode($plan, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
$adapterCommand = 'node ' . escapeshellarg(__DIR__ . '/prepare-query-routing.cjs') . ' '
  . escapeshellarg($projectRoot . '/storage/reports/staging/ftp-plan.json');
passthru($adapterCommand, $adapterStatus);
if ($adapterStatus !== 0)
{
  throw new RuntimeException('The hosting routing adapter could not prepare the release.');
}
echo json_encode(['releaseId' => $releaseId, 'files' => count($files), 'publicHtmlFiles' => 0,
  'privateFtpRoot' => $privateFtpRoot, 'publicFtpRoot' => $publicFtpRoot,
  'credentialsPrinted' => false, 'databaseOperations' => 0], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
