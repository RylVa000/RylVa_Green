<?php
declare(strict_types=1);

require __DIR__ . '/FtpDeploymentClient.php';

$projectRoot = dirname(__DIR__, 2);
$stage = $argv[1] ?? '';
$stages = [
  'private' => ['guard', 'private'],
  'activate' => ['gateway'],
  'assets' => ['assets'],
];
if (!isset($stages[$stage]))
{
  throw new InvalidArgumentException('Choose a deployment stage: private, activate, or assets.');
}
$configuration = json_decode(file_get_contents($projectRoot . '/config/deployment.local.json'), true, 32, JSON_THROW_ON_ERROR);
$plan = json_decode(file_get_contents($projectRoot . '/storage/reports/staging/ftp-plan.json'), true, 32, JSON_THROW_ON_ERROR);
$publicRoot = '/' . $configuration['domain'];
$privateRoot = '/_rylva_green_private/releases/' . $plan['releaseId'];
if ($publicRoot !== '/rylvagreen.biz.id' || $plan['publicFtpRoot'] !== $publicRoot
  || $plan['privateFtpRoot'] !== $privateRoot
  || !preg_match('/^[0-9]{8}_[0-9]{6}_[a-f0-9]{8}$/', $plan['releaseId']))
{
  throw new RuntimeException('The transfer plan does not match the authorized domain or private release.');
}
$files = array_values(array_filter($plan['files'], static function (array $file) use ($stages, $stage): bool
{
  return in_array($file['area'], $stages[$stage], true);
}));
usort($files, static function (array $left, array $right): int
{
  $priority = ['guard' => 0, 'private' => 1, 'assets' => 2, 'gateway' => 3];
  return ($priority[$left['area']] <=> $priority[$right['area']])
    ?: strcmp($left['remote'], $right['remote']);
});
foreach ($files as $file)
{
  $allowed = str_starts_with($file['remote'], $publicRoot . '/')
    || str_starts_with($file['remote'], $privateRoot . '/')
    || $file['remote'] === '/_rylva_green_private/.htaccess';
  if (!$allowed || hash_file('sha256', $file['local']) !== $file['sha256'])
  {
    throw new RuntimeException('A transfer path or local checksum failed validation.');
  }
}

$reportPath = $projectRoot . '/storage/reports/staging/ftp-deployment.json';
$report = is_file($reportPath)
  ? json_decode(file_get_contents($reportPath), true, 32, JSON_THROW_ON_ERROR)
  : ['releaseId' => $plan['releaseId'], 'domain' => $configuration['domain'], 'files' => [], 'stages' => []];
if ($report['releaseId'] !== $plan['releaseId'])
{
  throw new RuntimeException('The deployment journal belongs to another release. Archive it before a new release.');
}
if ($stage !== 'private' && ($report['stages']['private']['completed'] ?? false) !== true)
{
  throw new RuntimeException('Verify the private application transfer before activation or assets.');
}
$saveReport = static function () use (&$report, $reportPath): void
{
  $report['updatedAt'] = gmdate(DATE_ATOM);
  file_put_contents($reportPath, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
};
$client = new FtpDeploymentClient($configuration);
$client->listDirectory($publicRoot);
$report['stages'][$stage] = ['completed' => false, 'startedAt' => gmdate(DATE_ATOM), 'total' => count($files)];
$saveReport();
$completed = 0;

try
{
  foreach ($files as $file)
  {
    $remotePath = $file['remote'];
    if (isset($report['files'][$remotePath]) && $report['files'][$remotePath]['sha256'] === $file['sha256'])
    {
      if (hash('sha256', $client->readFile($remotePath)) !== $file['sha256'])
      {
        throw new RuntimeException('A previously verified remote file has changed: ' . $remotePath);
      }
      $completed++;
      continue;
    }
    if (in_array($file['area'], ['gateway', 'guard'], true))
    {
      $backupPath = $projectRoot . '/storage/backups/staging-' . $plan['releaseId'] . $remotePath;
      try
      {
        $existing = $client->readFile($remotePath);
        if (!is_dir(dirname($backupPath)))
        {
          mkdir(dirname($backupPath), 0700, true);
        }
        file_put_contents($backupPath, $existing);
        $report['backups'][$remotePath] = ['local' => $backupPath, 'sha256' => hash('sha256', $existing)];
      }
      catch (RuntimeException $error)
      {
        $newPrivateDirectory = $file['area'] === 'guard' && $error->getCode() === 9;
        if ($error->getCode() !== 78 && !$newPrivateDirectory)
        {
          throw $error;
        }
        $report['backups'][$remotePath] = ['existed' => false];
      }
    }
    $temporaryPath = $remotePath . '.upload-' . $plan['releaseId'];
    $client->uploadFile($file['local'], $temporaryPath);
    if (hash('sha256', $client->readFile($temporaryPath)) !== $file['sha256'])
    {
      throw new RuntimeException('The uploaded file failed checksum verification: ' . $remotePath);
    }
    $client->renameFile($temporaryPath, $remotePath);
    $report['files'][$remotePath] = ['sha256' => $file['sha256'], 'area' => $file['area'], 'verifiedAt' => gmdate(DATE_ATOM)];
    $completed++;
    $saveReport();
    if ($completed % 25 === 0 || $completed === count($files))
    {
      echo $stage . ': ' . $completed . '/' . count($files) . ' files uploaded and verified.' . PHP_EOL;
      flush();
    }
  }
  $report['stages'][$stage]['completed'] = true;
  $report['stages'][$stage]['completedAt'] = gmdate(DATE_ATOM);
  $report['stages'][$stage]['verified'] = $completed;
  $report['databaseOperations'] = 0;
  $saveReport();
  echo $stage . ' completed. Database operations: 0.' . PHP_EOL;
}
catch (Throwable $error)
{
  $report['stages'][$stage]['verified'] = $completed;
  $report['stages'][$stage]['error'] = $error->getMessage();
  $saveReport();
  fwrite(STDERR, $error->getMessage() . PHP_EOL);
  exit(1);
}
