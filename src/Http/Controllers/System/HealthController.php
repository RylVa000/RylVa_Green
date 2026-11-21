<?php
declare(strict_types=1);

namespace RylvaGreen\Http\Controllers\System;

use Closure;
use PDO;
use PDOException;
use RylvaGreen\Http\HttpException;
use RylvaGreen\Http\Request;
use RylvaGreen\Http\Response;

final class HealthController
{
  private readonly Closure $connectionFactory;

  public function __construct(callable $connectionFactory)
  {
    $this->connectionFactory = Closure::fromCallable($connectionFactory);
  }

  public function __invoke(Request $request): Response
  {
    try
    {
      /** @var PDO $connection */
      $connection = ($this->connectionFactory)();
      if ((int) $connection->query('SELECT 1')->fetchColumn() !== 1)
      {
        throw new HttpException(503, 'DATABASE_UNAVAILABLE', 'Layanan belum siap. Silakan coba lagi.');
      }
    }
    catch (PDOException)
    {
      throw new HttpException(503, 'DATABASE_UNAVAILABLE', 'Layanan belum siap. Silakan coba lagi.');
    }
    return Response::json(['status' => 'ok', 'services' => ['database' => 'ok']]);
  }
}
