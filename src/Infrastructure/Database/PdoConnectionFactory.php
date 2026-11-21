<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Database;

use PDO;

final class PdoConnectionFactory
{
  public static function create(): PDO
  {
    $settings = require dirname(__DIR__, 3) . '/config/database.php';
    $dsn = sprintf(
      'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
      $settings['host'],
      $settings['port'],
      $settings['database']
    );
    $connection = new PDO($dsn, $settings['username'], $settings['password'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_EMULATE_PREPARES => false,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_TIMEOUT => 3,
    ]);
    $connection->exec("SET time_zone = '+00:00'");
    return $connection;
  }
}
