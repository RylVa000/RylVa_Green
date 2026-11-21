<?php
declare(strict_types=1);

use RylvaGreen\Config\AppConfig;
use RylvaGreen\Http\Controllers\System\HealthController;
use RylvaGreen\Http\ErrorResponder;
use RylvaGreen\Http\HttpException;
use RylvaGreen\Http\Kernel;
use RylvaGreen\Http\Request;
use RylvaGreen\Http\Response;
use RylvaGreen\Infrastructure\Database\DatabaseConnection;
use RylvaGreen\Infrastructure\Database\TestingSchemaMigration;

$checks = [];
$temporaryFiles = [];
$exitCode = 0;
$check = static function (bool $condition, string $label) use (&$checks): void
{
  if (!$condition)
  {
    throw new RuntimeException('FAILED: ' . $label);
  }
  $checks[] = $label;
};
$expectHttp = static function (callable $operation, int $status, string $code) use ($check): void
{
  try
  {
    $operation();
    throw new RuntimeException('Expected HTTP validation exception was not raised.');
  }
  catch (HttpException $error)
  {
    $check($error->status === $status && $error->errorCode === $code, 'HTTP validation ' . $code);
  }
};

try
{
  require __DIR__ . '/bootstrap.php';
  $projectRoot = dirname(__DIR__);
  $check(class_exists(HealthController::class), 'PSR-4 resolves application classes');
  $fixture = tempnam($projectRoot . '/storage/cache', 'foundation_env_');
  $temporaryFiles[] = $fixture;
  $baseEnvironment = "APP_ENV=testing\nAPP_DEBUG=false\nAPP_BASE_URL=http://127.0.0.1:4186\n"
    . "DB_HOST=127.0.0.1\nDB_PORT=13367\nDB_NAME=rylva_green_fixture_test\nDB_USER=fixture\n"
    . "DB_PASSWORD=never_print_this_fixture_secret\nTEST_LABEL=\"Hijau # kebun ¿\"\n";
  $probe = static function (string $text, array $overrides = []) use ($fixture): array
  {
    file_put_contents($fixture, $text);
    $environment = getenv();
    foreach (array_keys($environment) as $key)
    {
      if (preg_match('/^(APP_|DB_|RYLVA_|TEST_LABEL$)/', $key))
      {
        unset($environment[$key]);
      }
    }
    $process = proc_open([PHP_BINARY, __DIR__ . '/fixtures/foundation-config.php', $fixture],
      [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes,
      dirname(__DIR__), [...$environment, ...$overrides], ['bypass_shell' => true]);
    if (!is_resource($process))
    {
      throw new RuntimeException('The configuration probe could not be started.');
    }
    fclose($pipes[0]);
    $result = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    if (proc_close($process) !== 0 || $stderr !== '')
    {
      throw new RuntimeException('The configuration probe failed before validation.');
    }
    return json_decode($result, true, 512, JSON_THROW_ON_ERROR);
  };
  $valid = $probe("\xEF\xBB\xBF" . $baseEnvironment);
  $check($valid['ok'] && $valid['label'] === 'Hijau # kebun ¿', 'BOM, quoted hashes and Unicode environment values are preserved');
  $override = $probe($baseEnvironment, ['DB_PORT' => '13368']);
  $check($override['ok'] && $override['port'] === '13368', 'Process environment overrides the file');
  foreach ([
    ['DB_PORT=13367', 'DB_PORT=70000'],
    ['DB_HOST=127.0.0.1', 'DB_HOST=localhost;dbname=other'],
    ['DB_NAME=rylva_green_fixture_test', 'DB_NAME=unsafe-name'],
    ['DB_USER=fixture', 'DB_USER='],
    ['APP_DEBUG=false', 'APP_DEBUG=invalid'],
    ['APP_BASE_URL=http://127.0.0.1:4186', 'APP_BASE_URL=https://user:secret@example.test'],
  ] as [$original, $invalid])
  {
    $result = $probe(str_replace($original, $invalid, $baseEnvironment));
    $check(!$result['ok'], 'Invalid configuration is rejected: ' . explode('=', $original)[0]);
    $check(!str_contains($result['message'], 'never_print_this_fixture_secret'), 'Configuration errors do not expose secrets');
  }
  $production = str_replace(['APP_ENV=testing', 'APP_DEBUG=false'], ['APP_ENV=production', 'APP_DEBUG=true'], $baseEnvironment);
  $check(!$probe($production)['ok'], 'Production debug configuration is rejected');

  $request = new Request('POST', '/api/example', [], ['content-type' => 'application/json; charset=utf-8'], '{"name":"Monstera","quantity":2}');
  $check($request->jsonObject() === ['name' => 'Monstera', 'quantity' => 2], 'JSON objects retain field values and numeric types');
  $expectHttp(static fn () => (new Request('POST', '/', [], [], '{}'))->jsonObject(), 415, 'UNSUPPORTED_MEDIA_TYPE');
  $expectHttp(static fn () => (new Request('POST', '/', [], ['content-type' => 'application/json'], '{'))->jsonObject(), 400, 'INVALID_JSON');
  $expectHttp(static fn () => (new Request('POST', '/', [], ['content-type' => 'application/json'], '[]'))->jsonObject(), 422, 'INVALID_PAYLOAD');
  $savedServer = $_SERVER;
  foreach (['/bad%2', '/bad%00path', '/%2e%2e/config/.env', '/bad%5cpath', '/bad%FFpath'] as $target)
  {
    $_SERVER['REQUEST_URI'] = $target;
    $_SERVER['REQUEST_METHOD'] = 'GET';
    try
    {
      Request::fromGlobals();
      throw new RuntimeException('Malformed request target was accepted.');
    }
    catch (HttpException $error)
    {
      $check($error->status === 400, 'Malformed request target is rejected');
    }
  }
  $_SERVER = $savedServer;
  $check(json_decode(Response::json(['message' => 'Tanaman hijau'])->body, true)['message'] === 'Tanaman hijau', 'JSON response preserves application text');
  try
  {
    Response::redirect('//external.example');
    throw new RuntimeException('An external redirect was accepted.');
  }
  catch (InvalidArgumentException)
  {
    $check(true, 'Redirects reject external destinations');
  }
  try
  {
    new Response('', 200, ['Location' => "/safe\r\nInjected: true"]);
    throw new RuntimeException('A response header injection was accepted.');
  }
  catch (InvalidArgumentException)
  {
    $check(true, 'Response headers reject CRLF injection');
  }
  $errors = new ErrorResponder($projectRoot);
  $kernel = new Kernel([
    ['method' => 'GET', 'path' => '/ok', 'handler' => static fn (Request $request): Response => Response::json(['ok' => true])],
    ['method' => 'GET', 'path' => '/fail', 'handler' => static fn (Request $request): Response => throw new RuntimeException('never_expose_this_internal_detail')],
  ], $errors);
  $check($kernel->handle(new Request('GET', '/ok'))->status === 200, 'Kernel dispatches a known route');
  $check($kernel->handle(new Request('HEAD', '/ok'))->status === 200, 'HEAD uses the GET route');
  $notFound = $kernel->handle(new Request('GET', '/api/missing'));
  $check($notFound->status === 404, 'Missing API routes return 404');
  $check(json_decode($notFound->body, true)['error']['requestId'] === $notFound->headers['X-Request-Id'], 'Error request identifiers match their response headers');
  $notAllowed = $kernel->handle(new Request('POST', '/ok'));
  $check($notAllowed->status === 405 && $notAllowed->headers['Allow'] === 'GET, HEAD', 'Wrong methods return 405 and an Allow header');
  $failure = $kernel->handle(new Request('GET', '/fail', [], ['accept' => 'application/json']));
  $check($failure->status === 500 && !str_contains($failure->body, 'never_expose'), 'Unexpected exceptions produce a sanitized 500 response');
  $htmlError = $kernel->handle(new Request('GET', '/deep/missing/page'));
  $check($htmlError->status === 404 && str_contains($htmlError->body, '<base href="/pages/public/">'), 'Nested HTML errors preserve existing botanical page assets');
  $unavailable = new HealthController(static fn (): PDO => throw new PDOException('private_connection_information'));
  $expectHttp(static fn () => $unavailable(new Request('GET', '/health')), 503, 'DATABASE_UNAVAILABLE');

  $connection = DatabaseConnection::get();
  $migration = new TestingSchemaMigration($connection, $projectRoot);
  $migration->assertTestingDatabase();
  $check($connection === DatabaseConnection::get(), 'One PDO connection is reused within a request');
  $check((int) $connection->query('SELECT 1')->fetchColumn() === 1, 'Real isolated MySQL is reachable');
  $check($connection->query('SELECT @@session.time_zone')->fetchColumn() === '+00:00', 'Database session uses UTC');
  $check(!$connection->getAttribute(PDO::ATTR_EMULATE_PREPARES), 'PDO uses native prepared statements');
  $payload = "value'; DROP TABLE produk; --";
  $statement = $connection->prepare('SELECT ? AS literal_value');
  $statement->execute([$payload]);
  $check($statement->fetchColumn() === $payload, 'SQL metacharacters remain bound values');
  $result = $migration->apply();
  $check($result['status'] === 'already_applied', 'A completed baseline migration is not applied twice');
  $check((int) $connection->query('SELECT COUNT(*) FROM migrasi_skema')->fetchColumn() === 1, 'Migration retry does not duplicate its journal');
  $tableTypes = $connection->query("SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.tables WHERE table_schema = DATABASE()")->fetchAll(PDO::FETCH_KEY_PAIR);
  foreach (['bahan_florist', 'stok_bahan_florist', 'mutasi_stok_bahan', 'mutasi_stok_produk', 'snapshot_produk_pesanan', 'kategori'] as $name)
  {
    $check(($tableTypes[$name] ?? '') === 'VIEW', 'Compatibility name remains a view: ' . $name);
  }
  foreach (['bahan_produksi', 'stok_bahan_produksi', 'riwayat_perubahan_stok_bahan', 'riwayat_perubahan_stok_produk', 'item_pesanan', 'varian_produk'] as $name)
  {
    $check(($tableTypes[$name] ?? '') === 'BASE TABLE', 'Canonical table is available: ' . $name);
  }
  $check((int) $connection->query("SELECT COUNT(*) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE()")->fetchColumn() === 136, 'Imported foreign keys are present');
  $check((int) $connection->query("SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = DATABASE()")->fetchColumn() === 23, 'Imported database triggers are present');
  $connection->exec('CREATE TEMPORARY TABLE foundation_probe (id INT PRIMARY KEY, quantity INT UNSIGNED NOT NULL) ENGINE=InnoDB');
  $connection->beginTransaction();
  $connection->exec('INSERT INTO foundation_probe VALUES (1, 3)');
  $connection->rollBack();
  $check((int) $connection->query('SELECT COUNT(*) FROM foundation_probe')->fetchColumn() === 0, 'InnoDB rollback leaves no partial write');
  $connection->beginTransaction();
  $connection->exec('INSERT INTO foundation_probe VALUES (1, 3)');
  $connection->commit();
  $check((int) $connection->query('SELECT quantity FROM foundation_probe WHERE id = 1')->fetchColumn() === 3, 'Committed data can be read back');
  $connection->exec('DROP TEMPORARY TABLE foundation_probe');
  foreach (['APP_ENV' => 'production', 'DB_NAME' => 'rylva_green_live'] as $key => $value)
  {
    $previous = getenv($key);
    putenv($key . '=' . $value);
    try
    {
      $migration->assertTestingDatabase();
      throw new LogicException('Unsafe migration target was accepted.');
    }
    catch (RuntimeException $error)
    {
      $check(str_contains($error->getMessage(), 'only supports'), 'Migration target guard rejects ' . $key . ' override');
    }
    finally
    {
      putenv($previous === false ? $key : $key . '=' . $previous);
    }
  }
  $report = ['passed' => true, 'checks' => $checks, 'count' => count($checks)];
  $reportPath = $projectRoot . '/storage/reports/foundation';
  if (!is_dir($reportPath))
  {
    mkdir($reportPath, 0700, true);
  }
  file_put_contents($reportPath . '/php-tests.json', json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
  echo json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
}
catch (Throwable $error)
{
  fwrite(STDERR, get_class($error) . ': ' . ($error instanceof PDOException ? 'Database test failed; inspect the isolated environment.' : $error->getMessage()) . PHP_EOL);
  $exitCode = 1;
}
finally
{
  foreach ($temporaryFiles as $file)
  {
    if (is_file($file))
    {
      unlink($file);
    }
  }
}
exit($exitCode);
