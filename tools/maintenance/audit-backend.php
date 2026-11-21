<?php
declare(strict_types=1);

// Static inventory only: code presence does not establish runtime/business correctness.
$projectRoot = dirname(__DIR__, 2);
$baseline = in_array('--baseline', $argv, true);
$runGit = static function (array $arguments) use ($projectRoot): string
{
  $process = proc_open(['git', ...$arguments],
    [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes,
    $projectRoot, null, ['bypass_shell' => true]);
  if (!is_resource($process))
  {
    throw new RuntimeException('Git could not be started for the baseline inventory.');
  }
  fclose($pipes[0]);
  $output = stream_get_contents($pipes[1]);
  $error = stream_get_contents($pipes[2]);
  fclose($pipes[1]);
  fclose($pipes[2]);
  if (proc_close($process) !== 0)
  {
    throw new RuntimeException('Git baseline read failed: ' . $error);
  }
  return $output;
};

$paths = [];
if ($baseline)
{
  $paths = array_filter(explode("\n", trim($runGit(['ls-tree', '-r', '--name-only', 'HEAD', '--', 'src', 'config', 'tests', 'bin']))));
}
else
{
  foreach (['src', 'config', 'tests', 'bin'] as $directory)
  {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($projectRoot . '/' . $directory, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file)
    {
      if ($file->isFile())
      {
        $paths[] = str_replace('\\', '/', substr($file->getPathname(), strlen($projectRoot) + 1));
      }
    }
  }
}
sort($paths);
$rows = [];
$counts = [];
foreach ($paths as $relativePath)
{
  if (pathinfo($relativePath, PATHINFO_EXTENSION) !== 'php')
  {
    continue;
  }
  $source = $baseline ? $runGit(['show', 'HEAD:' . $relativePath]) : file_get_contents($projectRoot . '/' . $relativePath);
  $significant = '';
  foreach (token_get_all($source) as $token)
  {
    if (is_array($token))
    {
      if (!in_array($token[0], [T_OPEN_TAG, T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true))
      {
        $significant .= $token[1];
      }
    }
    else
    {
      $significant .= $token;
    }
  }
  $significant = preg_replace('/^declare\(strict_types=1\);/', '', $significant) ?? $significant;
  $status = $significant === '' ? 'scaffold' : 'code_present';
  $area = explode('/', $relativePath)[0];
  $counts[$area][$status] = ($counts[$area][$status] ?? 0) + 1;
  $rows[] = ['path' => $relativePath, 'status' => $status,
    'lines' => substr_count($source, "\n") + 1, 'sha256' => hash('sha256', $source)];
}
$report = ['reference' => $baseline ? trim($runGit(['rev-parse', 'HEAD'])) : 'working_tree',
  'generatedAtUtc' => gmdate(DATE_ATOM), 'meaning' => 'Static code presence only; not an implementation-completion claim.',
  'counts' => $counts, 'files' => $rows];
$outputDirectory = $projectRoot . '/storage/reports/foundation';
if (!is_dir($outputDirectory))
{
  mkdir($outputDirectory, 0700, true);
}
$outputFile = $outputDirectory . '/backend-inventory' . ($baseline ? '-baseline' : '') . '.json';
file_put_contents($outputFile, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
echo json_encode(['counts' => $counts, 'files' => count($rows), 'report' => $outputFile], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
