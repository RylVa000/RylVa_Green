<?php
declare(strict_types=1);

$root = dirname(__DIR__, 2);
$engine = $argv[1] ?? 'mysql';
if (!in_array($engine, ['mysql', 'mariadb'], true))
{
  throw new InvalidArgumentException('Choose mysql or mariadb.');
}
$ci = getenv('GITHUB_ACTIONS') === 'true';
$databaseName = 'rylva_green_schema_' . $engine . '_' . bin2hex(random_bytes(4)) . '_test';
$databaseCreated = false;
if ($ci)
{
  $settings = ['host' => '127.0.0.1', 'port' => 13367, 'user' => 'root', 'password' => getenv('MYSQL_PWD') ?: ''];
  $client = getenv('MYSQL_CLIENT_BIN') ?: 'mysql';
}
elseif ($engine === 'mysql')
{
  $client = 'C:/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysql.exe';
  $runAdmin = static function (string $sql) use ($client, $root): string
  {
    $process = proc_open([$client, '--defaults-file=' . $root . '/storage/cache/foundation-mysql/admin.ini',
      '--batch', '--raw', '--skip-column-names'], [['pipe', 'r'], ['pipe', 'w'], ['pipe', 'w']], $pipes, $root);
    fwrite($pipes[0], $sql);
    fclose($pipes[0]);
    $result = stream_get_contents($pipes[1]);
    stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    if (proc_close($process) !== 0)
    {
      throw new RuntimeException('The isolated MySQL fixture setup failed.');
    }
    return $result;
  };
  $server = explode("\t", trim($runAdmin('SELECT @@datadir, @@port;')));
  $actualPath = strtolower(rtrim(preg_replace('~/+~', '/', str_replace('\\', '/', $server[0])), '/'));
  $expectedPath = strtolower(str_replace('\\', '/', $root . '/storage/cache/foundation-mysql/data'));
  if ($actualPath !== $expectedPath || (int) ($server[1] ?? 0) !== 13367)
  {
    throw new RuntimeException('The MySQL administrative connection is not the workspace test server.');
  }
  $settings = ['host' => '127.0.0.1', 'port' => 13367,
    'user' => 'schema_' . bin2hex(random_bytes(4)), 'password' => bin2hex(random_bytes(16))];
  $runAdmin('CREATE DATABASE `' . $databaseName . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
    . "CREATE USER '" . $settings['user'] . "'@'127.0.0.1' IDENTIFIED BY '" . $settings['password'] . "';"
    . 'GRANT ALL PRIVILEGES ON `' . $databaseName . "`.* TO '" . $settings['user'] . "'@'127.0.0.1';");
  $databaseCreated = true;
}
else
{
  $settings = ['host' => '127.0.0.1', 'port' => 13368, 'user' => 'root', 'password' => ''];
  $client = $root . '/storage/cache/mariadb-11.8.6/mariadb-11.8.6-winx64/bin/mariadb.exe';
}
if (!in_array($settings['host'], ['127.0.0.1', 'localhost'], true)
  || !in_array((int) $settings['port'], [13367, 13368], true))
{
  throw new RuntimeException('Schema verification only supports the isolated local test servers.');
}
$connection = new PDO('mysql:host=127.0.0.1;port=' . (int) $settings['port'] . ';charset=utf8mb4',
  $settings['user'], $settings['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
$identity = $connection->query('SELECT @@datadir AS dataPath, @@port AS port, VERSION() AS version')->fetch(PDO::FETCH_ASSOC);
if (!$ci)
{
  $expectedPath = $root . ($engine === 'mysql' ? '/storage/cache/foundation-mysql/data/' : '/storage/cache/mariadb-11.8.6/data-test/');
  if (strtolower(rtrim(str_replace('\\', '/', $identity['dataPath']), '/'))
    !== strtolower(rtrim(str_replace('\\', '/', $expectedPath), '/')))
  {
    throw new RuntimeException('The listener does not belong to the workspace test database.');
  }
}
if (!$databaseCreated)
{
  $connection->exec('CREATE DATABASE `' . $databaseName . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
}
$directory = $root . '/storage/cache/schema-' . $databaseName;
mkdir($directory, 0700, true);
$options = "[client]\nprotocol=TCP\ndefault-character-set=utf8mb4\n";
foreach ($settings as $key => $value)
{
  $options .= $key . '="' . str_replace(['\\', '"'], ['\\\\', '\\"'], (string) $value) . '"' . "\n";
}
file_put_contents($directory . '/client.ini', $options);
$process = proc_open([$client, '--defaults-file=' . $directory . '/client.ini', '--binary-mode', $databaseName], [
  0 => ['file', $root . '/database/schema/rylva-staging-structure.sql', 'r'],
  1 => ['file', $directory . '/import.stdout', 'w'],
  2 => ['file', $directory . '/import.stderr', 'w'],
], $pipes, $root, null, ['bypass_shell' => true]);
if (!is_resource($process) || proc_close($process) !== 0)
{
  throw new RuntimeException('Schema import failed: ' . file_get_contents($directory . '/import.stderr'));
}
$connection->exec('USE `' . $databaseName . '`');
$objects = $connection->query('SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchAll(PDO::FETCH_ASSOC);
$tables = array_filter($objects, static fn (array $object): bool => $object['TABLE_TYPE'] === 'BASE TABLE');
$views = count($objects) - count($tables);
$triggers = (int) $connection->query('SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()')->fetchColumn();
$foreignKeys = (int) $connection->query('SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()')->fetchColumn();
if (count($tables) !== 68 || $views !== 10 || $triggers !== 23 || $foreignKeys !== 136)
{
  throw new RuntimeException('Imported schema inventory differs from the reviewed baseline.');
}
foreach ($tables as $table)
{
  if ((int) $connection->query('SELECT COUNT(*) FROM `' . $table['TABLE_NAME'] . '`')->fetchColumn() !== 0)
  {
    throw new RuntimeException('A fixture row appeared in the clean structure artifact.');
  }
}
$invokerViews = (int) $connection->query("SELECT COUNT(*) FROM information_schema.VIEWS
  WHERE TABLE_SCHEMA = DATABASE() AND SECURITY_TYPE = 'INVOKER'")->fetchColumn();
if ($invokerViews !== 10)
{
  throw new RuntimeException('A view retained elevated definer security.');
}
$report = ['passed' => true, 'checkedAt' => gmdate(DATE_ATOM), 'engine' => $engine, 'databaseVersion' => $identity['version'],
  'baseTables' => count($tables), 'views' => $views, 'triggers' => $triggers, 'foreignKeys' => $foreignKeys,
  'fixtureRows' => 0, 'invokerViews' => $invokerViews, 'databaseName' => $databaseName];
file_put_contents($root . '/storage/reports/staging/schema-' . $engine . '.json', json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
echo json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
