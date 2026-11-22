<?php
declare(strict_types=1);

// Extracts reviewed DDL from the pinned baseline; fixture rows never enter the hosting artifact.
$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';
$manifest = require $root . '/database/migrations/0001_initial_schema.php';
$sourcePath = $root . '/' . $manifest['source'];
if (!RylvaGreen\Infrastructure\Database\SchemaChecksum::matches(file_get_contents($sourcePath), $manifest))
{
  throw new RuntimeException('The baseline checksum changed. Review a numbered migration first.');
}
$source = str_replace("\r\n", "\n", file_get_contents($sourcePath));
preg_match_all('/CREATE\s+ALGORITHM=.*?\bVIEW\s+`([^`]+)`/i', $source, $matches);
$viewNames = $matches[1];
$groups = ['tables' => [], 'alterations' => [], 'views' => [], 'triggers' => []];
$delimiter = ';';
$buffer = '';
foreach (explode("\n", $source) as $line)
{
  $trimmed = trim($line);
  if ($trimmed === '' || str_starts_with($trimmed, '--'))
  {
    continue;
  }
  if (preg_match('/^DELIMITER\s+(\S+)$/', $trimmed, $directive))
  {
    if (trim($buffer) !== '')
    {
      throw new RuntimeException('Unexpected delimiter inside a statement.');
    }
    $delimiter = $directive[1];
    continue;
  }
  $buffer .= $line . "\n";
  if (!str_ends_with($trimmed, $delimiter))
  {
    continue;
  }
  $statement = substr(rtrim($buffer), 0, -strlen($delimiter));
  $buffer = '';
  $statement = preg_replace('/DEFINER\s*=\s*`[^`]+`@`[^`]+`\s*/i', '', $statement);
  if (preg_match('/^CREATE TABLE `([^`]+)`/', $statement, $table))
  {
    if (!in_array($table[1], $viewNames, true))
    {
      $groups['tables'][] = $statement;
    }
  }
  elseif (preg_match('/^ALTER TABLE `([^`]+)`/', $statement, $table))
  {
    if (!in_array($table[1], $viewNames, true))
    {
      $groups['alterations'][] = preg_replace('/,\s*AUTO_INCREMENT=\d+/', '', $statement);
    }
  }
  elseif (preg_match('/^CREATE\s+ALGORITHM=.*?\bVIEW\b/i', $statement))
  {
    $groups['views'][] = str_replace('SQL SECURITY DEFINER', 'SQL SECURITY INVOKER', $statement);
  }
  elseif (str_starts_with($statement, 'CREATE TRIGGER '))
  {
    $groups['triggers'][] = $statement;
  }
}
if (trim($buffer) !== '' || count($groups['tables']) !== 68
  || count($groups['views']) !== 10 || count($groups['triggers']) !== 23)
{
  throw new RuntimeException('The extracted schema does not match the reviewed baseline inventory.');
}
$pendingViews = [];
foreach ($groups['views'] as $statement)
{
  preg_match('/\bVIEW\s+`([^`]+)`/', $statement, $view);
  $pendingViews[$view[1]] = $statement;
}
$groups['views'] = [];
while ($pendingViews !== [])
{
  $progress = false;
  foreach ($pendingViews as $name => $statement)
  {
    $dependencies = array_filter(array_keys($pendingViews),
      static fn (string $candidate): bool => $candidate !== $name && str_contains($statement, '`' . $candidate . '`'));
    if ($dependencies === [])
    {
      $groups['views'][] = $statement;
      unset($pendingViews[$name]);
      $progress = true;
    }
  }
  if (!$progress)
  {
    throw new RuntimeException('View dependencies contain a cycle.');
  }
}
$output = "-- RylVa Green: initial structure for an EMPTY selected database.\n"
  . "-- No fixture INSERTs, DROP, TRUNCATE, CREATE DATABASE, or USE statements.\n"
  . "-- DDL is not transactionally reversible. Stop and inspect any import error.\n"
  . '-- Source SHA-256: ' . $manifest['checksum'] . "\n\n"
  . "SET NAMES utf8mb4;\nSET time_zone = '+00:00';\n\n";
foreach (['tables', 'alterations', 'views'] as $group)
{
  $output .= implode(";\n\n", $groups[$group]) . ";\n\n";
}
$output .= "DELIMITER $$\n" . implode("$$\n\n", $groups['triggers']) . "$$\nDELIMITER ;\n";
$target = $root . '/database/schema/rylva-staging-structure.sql';
file_put_contents($target, $output);
$reportDirectory = $root . '/storage/reports/staging';
if (!is_dir($reportDirectory))
{
  mkdir($reportDirectory, 0700, true);
}
$report = ['sourceChecksum' => $manifest['checksum'], 'artifactChecksum' => hash('sha256', $output),
  'tables' => 68, 'views' => 10, 'triggers' => 23, 'fixtureRows' => 0, 'destructiveStatements' => 0];
file_put_contents($root . '/storage/reports/staging/schema-package.json', json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
echo json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
