<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Database;

use PDO;

final class DatabaseConnection
{
  private static ?PDO $connection = null;

  public static function get(): PDO
  {
    if (self::$connection === null)
    {
      self::$connection = PdoConnectionFactory::create();
    }
    return self::$connection;
  }
}
