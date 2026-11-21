<?php
declare(strict_types=1);

// Review artifact only. No upload, database import or remote deployment is performed here.
$projectRoot = dirname(__DIR__, 2);
$reportDirectory = $projectRoot . '/storage/reports/staging';
if (!is_dir($reportDirectory))
{
  mkdir($reportDirectory, 0700, true);
}
$releaseId = gmdate('Ymd_His') . '_' . bin2hex(random_bytes(4));
$archivePath = $reportDirectory . '/rylva-staging-' . $releaseId . '.zip';
$files = ['composer.json', 'composer.lock'];
foreach (['public', 'src', 'config', 'vendor', 'deploy'] as $directory)
{
  if (!is_dir($projectRoot . '/' . $directory))
  {
    throw new RuntimeException('A required release directory is missing: ' . $directory);
  }
  $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(
    $projectRoot . '/' . $directory, FilesystemIterator::SKIP_DOTS
  ));
  foreach ($iterator as $file)
  {
    $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($projectRoot) + 1));
    if ($file->isLink())
    {
      throw new RuntimeException('Release packaging does not follow symlinks.');
    }
    if (!$file->isFile() || preg_match('~(^|/)(node_modules|\.hallmark|\.git|\.impeccable|\.taste-skill)(/|$)~', $relative))
    {
      continue;
    }
    if (str_starts_with($relative, 'config/')
      && $file->getExtension() !== 'php' && $relative !== 'config/preview-pages.json')
    {
      continue;
    }
    if (preg_match('~(^|/)\.[^/]+~', $relative) && $relative !== 'public/.htaccess')
    {
      continue;
    }
    $files[] = $relative;
  }
}
sort($files);
$hashes = [];
$sources = [];
$archive = new PharData($archivePath, 0, null, Phar::ZIP);
foreach ($files as $relative)
{
  $sources[$relative] = $projectRoot . '/' . $relative;
  $hashes[$relative] = hash_file('sha256', $projectRoot . '/' . $relative);
}
$archive->buildFromIterator(new ArrayIterator($sources));
$manifest = [
  'releaseId' => $releaseId, 'source' => 'working_tree', 'builtAtUtc' => gmdate(DATE_ATOM),
  'purpose' => 'Protected staging review; business services are not integrated.',
  'files' => $hashes,
];
$archive->addFromString('release-manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
if (extension_loaded('zlib'))
{
  $archive->compressFiles(Phar::GZ);
}
unset($archive);
$verify = new PharData($archivePath);
if (!isset($verify['public/.htaccess'], $verify['public/index.php'], $verify['vendor/autoload.php']))
{
  throw new RuntimeException('The release archive is missing a required runtime file.');
}
foreach ($hashes as $relative => $expectedHash)
{
  $content = $verify[$relative]->getContent();
  if (hash('sha256', $content) !== $expectedHash)
  {
    throw new RuntimeException('Release integrity verification failed: ' . $relative);
  }
}
$report = [
  'passed' => true, 'archive' => str_replace('\\', '/', $archivePath), 'releaseId' => $releaseId,
  'fileCount' => count($files), 'sha256' => hash_file('sha256', $archivePath),
  'containsPrivateEnvironment' => false, 'containsWorkbench' => false, 'deployed' => false,
];
file_put_contents($reportDirectory . '/package.json', json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . PHP_EOL;
