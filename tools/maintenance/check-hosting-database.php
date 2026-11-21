<?php
declare(strict_types=1);

// Read-only metadata verification. Never imports fixtures or reads customer records.
$root = dirname(__DIR__, 2);
$configuration = json_decode(file_get_contents($root . '/config/deployment.local.json'), true, 32, JSON_THROW_ON_ERROR);
$settings = $configuration['database'];
$report = ['checkedAt' => gmdate(DATE_ATOM), 'connected' => false, 'readOnly' => true, 'dataChanges' => 0];
try
{
  if (in_array($settings['host'], ['localhost', '127.0.0.1', '::1'], true))
  {
    throw new RuntimeException('The configured database is hosting-local and cannot be checked from this machine.');
  }
  $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
    $settings['host'], (int) $settings['port'], $settings['name']);
  $connection = new PDO($dsn, $settings['username'], $settings['password'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_TIMEOUT => 5,
  ]);
  $connection->exec('SET SESSION TRANSACTION READ ONLY');
  $connection->beginTransaction();
  $report['connected'] = (int) $connection->query('SELECT 1')->fetchColumn() === 1;
  $report['databaseVersion'] = $connection->query('SELECT VERSION()')->fetchColumn();
  $query = $connection->prepare('SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME');
  $query->execute([$settings['name']]);
  $objects = $query->fetchAll();
  $report['baseTables'] = count(array_filter($objects, static fn (array $object): bool => $object['TABLE_TYPE'] === 'BASE TABLE'));
  $report['views'] = count($objects) - $report['baseTables'];
  $report['objects'] = array_column($objects, 'TABLE_TYPE', 'TABLE_NAME');
  $query = $connection->prepare('SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?');
  $query->execute([$settings['name']]);
  $report['triggers'] = (int) $query->fetchColumn();
  $report['schemaEmpty'] = $objects === [];
  $connection->rollBack();
  $report['status'] = $report['schemaEmpty'] ? 'connected-empty-schema' : 'connected-schema-present';
}
catch (PDOException $error)
{
  $report['status'] = 'connection-unavailable';
  $report['sqlState'] = (string) $error->getCode();
  $report['driverCode'] = $error->errorInfo[1] ?? null;
  $report['nextStep'] = 'Confirm remote MySQL access and database credentials with the hosting panel.';
}
catch (RuntimeException)
{
  $report['status'] = 'hosting-local-access-required';
  $report['nextStep'] = 'Use an authorized database connection from the hosting environment.';
}
$path = $root . '/storage/reports/staging/database-check.json';
file_put_contents($path, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . PHP_EOL;
exit($report['connected'] ? 0 : 1);
