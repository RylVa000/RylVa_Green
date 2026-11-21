<?php
declare(strict_types=1);

$projectRoot = dirname(__DIR__, 2);
$files = [];
foreach (['src', 'config', 'bin', 'public', 'tests', 'tools'] as $directory)
{
  $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(
    $projectRoot . '/' . $directory, FilesystemIterator::SKIP_DOTS
  ));
  foreach ($iterator as $file)
  {
    $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($projectRoot) + 1));
    if ($file->isFile() && $file->getExtension() === 'php'
      && !preg_match('~/(node_modules|vendor|archive|\.hallmark)/~', $relative))
    {
      $files[] = $relative;
    }
  }
}
sort($files);
$failures = [];
foreach ($files as $file)
{
  $process = proc_open([PHP_BINARY, '-l', $projectRoot . '/' . $file], [
    0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w'],
  ], $pipes, $projectRoot, null, ['bypass_shell' => true]);
  if (!is_resource($process))
  {
    throw new RuntimeException('Unable to start PHP lint.');
  }
  fclose($pipes[0]);
  $output = stream_get_contents($pipes[1]) . stream_get_contents($pipes[2]);
  fclose($pipes[1]);
  fclose($pipes[2]);
  if (proc_close($process) !== 0)
  {
    $failures[] = ['file' => $file, 'error' => $output];
  }
}
$report = ['passed' => $failures === [], 'count' => count($files), 'failures' => $failures];
$reportDirectory = $projectRoot . '/storage/reports/ci';
if (!is_dir($reportDirectory))
{
  mkdir($reportDirectory, 0700, true);
}
file_put_contents($reportDirectory . '/php-lint.json', json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
echo json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
exit($failures === [] ? 0 : 1);
