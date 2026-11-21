<?php
declare(strict_types=1);

use RylvaGreen\Config\AppConfig;
use RylvaGreen\Infrastructure\Database\PdoConnectionFactory;
use RylvaGreen\Infrastructure\Database\TestingSchemaMigration;

$projectRoot = dirname(__DIR__, 2);
require $projectRoot . '/vendor/autoload.php';

try
{
  AppConfig::boot(getenv('RYLVA_TEST_ENV_FILE') ?: $projectRoot . '/config/.env.testing');
  $connection = PdoConnectionFactory::create();
  (new TestingSchemaMigration($connection, $projectRoot))->assertTestingDatabase();
  $queries = [
    'tables' => 'SELECT TABLE_NAME AS name, TABLE_TYPE AS type, ENGINE AS engine
      FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME',
    'columns' => 'SELECT TABLE_NAME AS tableName, COLUMN_NAME AS name, COLUMN_TYPE AS type,
      IS_NULLABLE AS nullable, COLUMN_DEFAULT AS defaultValue
      FROM information_schema.columns WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, ORDINAL_POSITION',
    'foreignKeys' => 'SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName,
      REFERENCED_TABLE_NAME AS targetTable, REFERENCED_COLUMN_NAME AS targetColumn
      FROM information_schema.key_column_usage
      WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION',
    'indexes' => 'SELECT TABLE_NAME AS tableName, INDEX_NAME AS name, NON_UNIQUE AS nonUnique,
      COLUMN_NAME AS columnName, SEQ_IN_INDEX AS position
      FROM information_schema.statistics WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX',
    'triggers' => 'SELECT TRIGGER_NAME AS name, EVENT_OBJECT_TABLE AS tableName,
      EVENT_MANIPULATION AS eventName, ACTION_TIMING AS timing
      FROM information_schema.triggers WHERE TRIGGER_SCHEMA = DATABASE() ORDER BY TRIGGER_NAME',
    'views' => 'SELECT TABLE_NAME AS name, VIEW_DEFINITION AS definition
      FROM information_schema.views WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME',
    'foreignKeyTypeMismatches' => 'SELECT fk.TABLE_NAME AS tableName, fk.COLUMN_NAME AS columnName,
      source.COLUMN_TYPE AS sourceType, target.COLUMN_TYPE AS targetType
      FROM information_schema.key_column_usage fk
      JOIN information_schema.columns source
        ON source.TABLE_SCHEMA = fk.TABLE_SCHEMA AND source.TABLE_NAME = fk.TABLE_NAME
        AND source.COLUMN_NAME = fk.COLUMN_NAME
      JOIN information_schema.columns target
        ON target.TABLE_SCHEMA = fk.REFERENCED_TABLE_SCHEMA
        AND target.TABLE_NAME = fk.REFERENCED_TABLE_NAME AND target.COLUMN_NAME = fk.REFERENCED_COLUMN_NAME
      WHERE fk.TABLE_SCHEMA = DATABASE() AND source.COLUMN_TYPE <> target.COLUMN_TYPE',
  ];
  $report = [
    'generatedAtUtc' => gmdate(DATE_ATOM),
    'source' => 'database/schema/DB_RylVa_Green.sql',
    'sourceSha256' => hash_file('sha256', $projectRoot . '/database/schema/DB_RylVa_Green.sql'),
    'database' => $connection->query('SELECT DATABASE()')->fetchColumn(),
    'serverVersion' => $connection->query('SELECT VERSION()')->fetchColumn(),
    'sessionTimezone' => $connection->query('SELECT @@session.time_zone')->fetchColumn(),
  ];
  foreach ($queries as $key => $query)
  {
    $report[$key] = $connection->query($query)->fetchAll();
  }
  $outputDirectory = $projectRoot . '/storage/reports/foundation';
  if (!is_dir($outputDirectory))
  {
    mkdir($outputDirectory, 0700, true);
  }
  file_put_contents($outputDirectory . '/schema-inventory.json', json_encode(
    $report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
  ));
  echo json_encode([
    'baseTables' => count(array_filter($report['tables'], static fn (array $table): bool => $table['type'] === 'BASE TABLE')),
    'views' => count($report['views']),
    'foreignKeyColumns' => count($report['foreignKeys']),
    'triggers' => count($report['triggers']),
    'foreignKeyTypeMismatches' => count($report['foreignKeyTypeMismatches']),
    'report' => 'storage/reports/foundation/schema-inventory.json',
  ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
}
catch (Throwable $error)
{
  fwrite(STDERR, $error instanceof PDOException ? 'Database audit failed; inspect the isolated environment.' : $error->getMessage());
  exit(1);
}
