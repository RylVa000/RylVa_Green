<?php
declare(strict_types=1);

use RylvaGreen\Config\AppConfig;
use RylvaGreen\Infrastructure\Database\PdoConnectionFactory;
use RylvaGreen\Infrastructure\Database\TestingSchemaMigration;

require dirname(__DIR__) . '/vendor/autoload.php';

try
{
  $projectRoot = dirname(__DIR__);
  $command = $argv[1] ?? 'check';
  if (!in_array($command, ['check', 'migrate'], true))
  {
    throw new InvalidArgumentException('Usage: php bin/database.php [check|migrate] [testing-env-file]');
  }
  $envFile = $argv[2] ?? ($projectRoot . '/config/.env.testing');
  AppConfig::boot($envFile);
  $connection = PdoConnectionFactory::create();
  $migration = new TestingSchemaMigration($connection, $projectRoot);
  $migration->assertTestingDatabase();
  $result = $command === 'migrate' ? $migration->apply() : ['status' => 'connected'];
  $result['database'] = $connection->query('SELECT DATABASE()')->fetchColumn();
  $result['serverVersion'] = $connection->query('SELECT VERSION()')->fetchColumn();
  $result['sessionTimezone'] = $connection->query('SELECT @@session.time_zone')->fetchColumn();
  $result['tables'] = (int) $connection->query("SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'")->fetchColumn();
  $result['views'] = (int) $connection->query("SELECT COUNT(*) FROM information_schema.views
    WHERE table_schema = DATABASE()")->fetchColumn();
  echo json_encode($result, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
}
catch (Throwable $error)
{
  fwrite(STDERR, $error->getMessage() . PHP_EOL);
  exit(1);
}
