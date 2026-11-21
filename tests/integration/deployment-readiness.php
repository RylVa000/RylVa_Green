<?php
declare(strict_types=1);

$projectRoot = dirname(__DIR__, 2);
$cacheDirectory = $projectRoot . '/storage/cache';
if (!is_dir($cacheDirectory))
{
  mkdir($cacheDirectory, 0700, true);
}
$fixturePath = tempnam($cacheDirectory, 'deployment_guard_');
$secret = 'never_expose_this_fixture_password';
$base = [
  'domain' => 'rylvagreen.biz.id', 'stagingUrl' => 'https://rylvagreen.biz.id',
  'ftp' => ['protocol' => 'ftps', 'host' => 'example.invalid', 'port' => 21, 'username' => 'fixture', 'password' => $secret],
  'paths' => ['publicRoot' => '/public_html', 'privateRoot' => '/application'],
];
$cases = [
  ['{}', 'incomplete'],
  ['{"ftp":{"password":"' . $secret, 'JSON is invalid'],
  [json_encode([...$base, 'ftp' => [...$base['ftp'], 'port' => 0]], JSON_THROW_ON_ERROR), 'hostname or port'],
  ["\xEF\xBB\xBF" . json_encode([...$base, 'ftp' => [...$base['ftp'], 'port' => 70000]], JSON_THROW_ON_ERROR), 'hostname or port'],
  [json_encode([...$base, 'stagingUrl' => 'http://rylvagreen.biz.id'], JSON_THROW_ON_ERROR), 'HTTPS staging URL'],
  [json_encode([...$base, 'paths' => ['publicRoot' => '/public_html/../private', 'privateRoot' => '/app']], JSON_THROW_ON_ERROR), 'absolute FTP paths'],
  [json_encode([...$base, 'paths' => ['publicRoot' => '/public_html', 'privateRoot' => '/public_html/app']], JSON_THROW_ON_ERROR), 'outside the public'],
  [json_encode([...$base, 'ftp' => [...$base['ftp'], 'password' => "invalid\r\npassword"]], JSON_THROW_ON_ERROR), 'invalid newline'],
  [json_encode([...$base, 'ftp' => [...$base['ftp'], 'protocol' => 'unsupported']], JSON_THROW_ON_ERROR), 'supported FTP/FTPS/SFTP'],
  [json_encode([...$base, 'ftp' => [...$base['ftp'], 'protocol' => 'sftp', 'port' => 22,
    'knownHostsFile' => $fixturePath . '.missing']], JSON_THROW_ON_ERROR), 'No pinned SSH hosts'],
];
$checks = [];
$exitCode = 0;
try
{
  foreach ($cases as [$json, $expectedMessage])
  {
    file_put_contents($fixturePath, $json);
    $process = proc_open([PHP_BINARY, $projectRoot . '/tools/maintenance/check-ftp-staging.php'], [
      0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w'],
    ], $pipes, $projectRoot, [...getenv(), 'RYLVA_DEPLOYMENT_CONFIG' => $fixturePath], ['bypass_shell' => true]);
    if (!is_resource($process))
    {
      throw new RuntimeException('Unable to start the deployment validation probe.');
    }
    fclose($pipes[0]);
    $output = stream_get_contents($pipes[1]);
    $errors = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $status = proc_close($process);
    $report = json_decode($output, true, 32, JSON_THROW_ON_ERROR);
    if ($status !== 1 || $errors !== '' || $report['connected'] || $report['uploaded']
      || !str_contains($report['message'], $expectedMessage) || str_contains($output, $secret))
    {
      throw new RuntimeException('Deployment guard failed: ' . $expectedMessage);
    }
    $checks[] = $expectedMessage . ': rejected before connection/upload without exposing credentials';
  }
  $report = ['passed' => true, 'count' => count($checks), 'checks' => $checks, 'networkCalls' => 0];
  $reportDirectory = $projectRoot . '/storage/reports/foundation';
  if (!is_dir($reportDirectory))
  {
    mkdir($reportDirectory, 0700, true);
  }
  file_put_contents($reportDirectory . '/deployment-readiness.json', json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
  echo json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
}
catch (Throwable $error)
{
  fwrite(STDERR, $error->getMessage() . PHP_EOL);
  $exitCode = 1;
}
finally
{
  if (is_file($fixturePath))
  {
    unlink($fixturePath);
  }
}
exit($exitCode);
