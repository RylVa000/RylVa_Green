<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/vendor/autoload.php';
use RylvaGreen\Infrastructure\Database\SchemaChecksum;

$root = dirname(__DIR__, 2);
$manifest = require $root . '/database/migrations/0001_initial_schema.php';
$source = str_replace("\r\n", "\n", file_get_contents($root . '/' . $manifest['source']));
$checks = [
  'Git/Linux LF source matches the pinned logical schema' => SchemaChecksum::matches($source, $manifest),
  'Windows CRLF source matches the same logical schema' => SchemaChecksum::matches(str_replace("\n", "\r\n", $source), $manifest),
  'Changed SQL is rejected' => !SchemaChecksum::matches(str_replace('CREATE TABLE', 'CREATE TEMPORARY TABLE', $source), $manifest),
  'Truncated SQL is rejected' => !SchemaChecksum::matches(substr($source, 0, -32), $manifest),
];
foreach ($checks as $name => $passed)
{
  if (!$passed)
  {
    throw new RuntimeException($name);
  }
}
echo json_encode(['passed' => true, 'checks' => array_keys($checks)], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
