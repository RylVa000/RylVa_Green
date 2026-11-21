<?php
declare(strict_types=1);

require __DIR__ . '/FtpDeploymentClient.php';
$projectRoot = dirname(__DIR__, 2);
$configuration = json_decode(file_get_contents($projectRoot . '/config/deployment.local.json'), true, 32, JSON_THROW_ON_ERROR);
$client = new FtpDeploymentClient($configuration);
$results = [];
foreach (array_unique(['/', $configuration['paths']['privateRoot'], $configuration['paths']['publicRoot']]) as $path)
{
  try
  {
    $results[$path] = ['readable' => true, 'listing' => $client->listDirectory($path)];
  }
  catch (RuntimeException $error)
  {
    $results[$path] = ['readable' => false, 'error' => $error->getMessage(), 'code' => $error->getCode()];
  }
}
$reportPath = $projectRoot . '/storage/reports/staging/ftp-inventory.json';
file_put_contents($reportPath, json_encode($results, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . PHP_EOL;
