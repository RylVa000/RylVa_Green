<?php
declare(strict_types=1);

// Non-executable origin check for the deployment explicitly requested by the user.
// Uploads only a unique random text file; removes only that same file. No remote PHP is executed.
require __DIR__ . '/FtpDeploymentClient.php';
$projectRoot = dirname(__DIR__, 2);
$configuration = json_decode(file_get_contents($projectRoot . '/config/deployment.local.json'), true, 32, JSON_THROW_ON_ERROR);
$client = new FtpDeploymentClient($configuration);
$nonce = bin2hex(random_bytes(20));
$path = '/.well-known/acme-challenge/rylva-origin-' . $nonce . '.txt';
$report = ['applicationUploaded' => false, 'probeExecutable' => false, 'originMatched' => false];
$uploaded = false;
try
{
  $client->uploadContent($nonce, $path);
  $uploaded = true;
  $host = parse_url($configuration['stagingUrl'], PHP_URL_HOST);
  $connection = curl_init('http://' . $host . $path);
  curl_setopt_array($connection, [
    CURLOPT_RESOLVE => [$host . ':80:' . $configuration['ftp']['host']],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => 15,
  ]);
  $body = curl_exec($connection);
  $report['httpStatus'] = curl_getinfo($connection, CURLINFO_RESPONSE_CODE);
  $report['transportError'] = curl_errno($connection);
  $report['originMatched'] = $report['httpStatus'] === 200 && $body === $nonce;
  $report['dnsBypassedForOriginInspection'] = true;
  curl_close($connection);
}
catch (Throwable $error)
{
  $report['message'] = $error->getMessage();
}
finally
{
  $report['temporaryFileRemoved'] = !$uploaded;
  if ($uploaded)
  {
    try
    {
      $client->removeFile($path);
      $report['temporaryFileRemoved'] = true;
    }
    catch (Throwable)
    {
      $report['cleanupPending'] = $path;
    }
  }
}
file_put_contents($projectRoot . '/storage/reports/staging/ftp-origin.json', json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
echo json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
exit($report['originMatched'] && $report['temporaryFileRemoved'] ? 0 : 1);
