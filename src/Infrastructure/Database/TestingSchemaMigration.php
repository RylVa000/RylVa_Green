<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Database;

use PDO;
use RuntimeException;
use Throwable;
use RylvaGreen\Config\AppConfig;

/** Initial baseline import for the isolated M0 database, not a production migration tool. */
final class TestingSchemaMigration
{
  public function __construct(private readonly PDO $connection, private readonly string $projectRoot)
  {
  }

  public function apply(): array
  {
    $this->assertTestingDatabase();
    $manifest = require $this->projectRoot . '/database/migrations/0001_initial_schema.php';
    $sourcePath = $this->projectRoot . '/' . $manifest['source'];
    $checksum = hash_file('sha256', $sourcePath);
    if ($checksum !== $manifest['checksum'])
    {
      throw new RuntimeException('The baseline source changed. Reconcile it in a new migration before applying it.');
    }
    $lock = $this->connection->prepare('SELECT GET_LOCK(?, 5)');
    $lockName = 'rylva_m0_' . AppConfig::get('DB_NAME');
    $lock->execute([$lockName]);
    if ((int) $lock->fetchColumn() !== 1)
    {
      throw new RuntimeException('Another migration is running. Try again after it finishes.');
    }

    try
    {
      return $this->applyLocked($manifest, $sourcePath);
    }
    finally
    {
      $statement = $this->connection->prepare('SELECT RELEASE_LOCK(?)');
      $statement->execute([$lockName]);
    }
  }

  public function assertTestingDatabase(): void
  {
    $databaseName = AppConfig::get('DB_NAME', '') ?? '';
    if (AppConfig::get('APP_ENV') !== 'testing'
      || !preg_match('/^rylva_green_[a-z0-9_]+_test$/', $databaseName)
      || !in_array(AppConfig::get('DB_HOST'), ['127.0.0.1', 'localhost', '::1'], true))
    {
      throw new RuntimeException('This command only supports an explicitly configured local rylva_green_*_test database.');
    }
    if ($this->connection->query('SELECT DATABASE()')->fetchColumn() !== $databaseName)
    {
      throw new RuntimeException('The connected database does not match the testing configuration.');
    }
  }

  private function applyLocked(array $manifest, string $sourcePath): array
  {
    $this->connection->exec("CREATE TABLE IF NOT EXISTS migrasi_skema (
      versi VARCHAR(80) NOT NULL PRIMARY KEY,
      checksum_sumber CHAR(64) NOT NULL,
      status_migrasi ENUM('dijalankan', 'selesai', 'gagal') NOT NULL,
      dimulai_pada DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      selesai_pada DATETIME(6) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $read = $this->connection->prepare('SELECT * FROM migrasi_skema WHERE versi = ?');
    $read->execute([$manifest['version']]);
    $existing = $read->fetch();
    if ($existing)
    {
      if ($existing['checksum_sumber'] !== $manifest['checksum'] || $existing['status_migrasi'] !== 'selesai')
      {
        throw new RuntimeException('The previous import is incomplete or its checksum differs. Inspect the isolated database before retrying; no automatic reset was performed.');
      }
      return ['version' => $manifest['version'], 'status' => 'already_applied'];
    }
    $count = $this->connection->query("SELECT COUNT(*) FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name <> 'migrasi_skema'")->fetchColumn();
    if ((int) $count !== 0)
    {
      throw new RuntimeException('The initial migration requires an empty testing database. Existing tables were preserved.');
    }
    $insert = $this->connection->prepare("INSERT INTO migrasi_skema
      (versi, checksum_sumber, status_migrasi) VALUES (?, ?, 'dijalankan')");
    $insert->execute([$manifest['version'], $manifest['checksum']]);

    try
    {
      $this->importWithNativeClient($sourcePath);
      $update = $this->connection->prepare("UPDATE migrasi_skema
        SET status_migrasi = 'selesai', selesai_pada = UTC_TIMESTAMP(6) WHERE versi = ?");
      $update->execute([$manifest['version']]);
      return ['version' => $manifest['version'], 'status' => 'applied'];
    }
    catch (Throwable $error)
    {
      $update = $this->connection->prepare("UPDATE migrasi_skema SET status_migrasi = 'gagal' WHERE versi = ?");
      $update->execute([$manifest['version']]);
      throw $error;
    }
  }

  private function importWithNativeClient(string $sourcePath): void
  {
    $binary = AppConfig::get('MYSQL_CLIENT_BIN', 'mysql') ?? 'mysql';
    $cachePath = $this->projectRoot . '/storage/cache';
    if (!is_dir($cachePath))
    {
      mkdir($cachePath, 0700, true);
    }
    $files = [];
    try
    {
      foreach (['options', 'sql', 'stdout', 'stderr'] as $name)
      {
        $files[$name] = tempnam($cachePath, 'm0_' . $name . '_');
        if ($files[$name] === false)
        {
          throw new RuntimeException('Unable to create a private migration file.');
        }
        chmod($files[$name], 0600);
      }
      $options = "[client]\nprotocol=TCP\ndefault-character-set=utf8mb4\n";
      foreach (['host' => 'DB_HOST', 'port' => 'DB_PORT', 'user' => 'DB_USER', 'password' => 'DB_PASSWORD'] as $option => $key)
      {
        $value = str_replace(['\\', '"'], ['\\\\', '\\"'], AppConfig::get($key, '') ?? '');
        $options .= $option . '="' . $value . '"' . "\n";
      }
      file_put_contents($files['options'], $options);
      $sql = file_get_contents($sourcePath);
      if ($sql === false)
      {
        throw new RuntimeException('The baseline SQL file could not be read.');
      }
      // The committed dump pins root@localhost. Test objects must use the scoped importing user instead.
      $sql = preg_replace('/DEFINER\s*=\s*`[^`]+`@`[^`]+`\s*/i', '', $sql);
      if ($sql === null)
      {
        throw new RuntimeException('The baseline definer normalization failed.');
      }
      file_put_contents($files['sql'], $sql);
      $process = proc_open([
        $binary,
        '--defaults-file=' . $files['options'],
        '--binary-mode',
        AppConfig::get('DB_NAME'),
      ], [
        0 => ['file', $files['sql'], 'r'],
        1 => ['file', $files['stdout'], 'w'],
        2 => ['file', $files['stderr'], 'w'],
      ], $pipes, $this->projectRoot, null, ['bypass_shell' => true]);
      if (!is_resource($process))
      {
        throw new RuntimeException('Unable to start the native MySQL client. Check MYSQL_CLIENT_BIN.');
      }
      $exitCode = proc_close($process);
      if ($exitCode !== 0)
      {
        $reportPath = $this->projectRoot . '/storage/reports/foundation';
        if (!is_dir($reportPath))
        {
          mkdir($reportPath, 0700, true);
        }
        file_put_contents($reportPath . '/migration-error.txt', file_get_contents($files['stderr']));
        throw new RuntimeException('MySQL import failed. See storage/reports/foundation/migration-error.txt. DDL may be partially applied; no rollback or automatic reset is claimed.');
      }
    }
    finally
    {
      foreach ($files as $file)
      {
        if (is_string($file) && is_file($file))
        {
          unlink($file);
        }
      }
    }
  }
}
