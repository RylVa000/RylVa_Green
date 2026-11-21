<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Integration;

use Closure;
use LogicException;

/** In-memory provider simulation. Never stores or changes application database records. */
final class MockProviderState
{
  private array $results = [];
  private array $failures = [];

  public function __construct(string $environment)
  {
    if (!in_array($environment, ['development', 'testing'], true))
    {
      throw new LogicException('Mock providers are restricted to development/testing.');
    }
  }

  public function failNext(string $operation, string $code, bool $afterCommit = false): void
  {
    if (!in_array($code, ['TIMEOUT', 'UNAVAILABLE', 'RATE_LIMITED'], true))
    {
      throw new LogicException('Unknown mock failure scenario.');
    }
    $this->failures[$operation][] = ['code' => $code, 'afterCommit' => $afterCommit];
  }

  public function run(string $operation, ?string $key, array $payload, Closure $work): array
  {
    $cacheKey = $operation . ':' . $key;
    $hash = hash('sha256', json_encode(self::canonicalize($payload), JSON_THROW_ON_ERROR));
    if ($key !== null && isset($this->results[$cacheKey]))
    {
      $previous = $this->results[$cacheKey];
      if ($previous['hash'] !== $hash)
      {
        throw new IntegrationFailure('IDEMPOTENCY_CONFLICT', 'Reuse the same key only for the same request.');
      }
      return $previous['result'];
    }
    $failure = null;
    if (!empty($this->failures[$operation]))
    {
      $failure = array_shift($this->failures[$operation]);
    }
    if ($failure !== null && !$failure['afterCommit'])
    {
      $this->raiseFailure($failure['code']);
    }
    $result = $work();
    if ($key !== null)
    {
      $this->results[$cacheKey] = ['hash' => $hash, 'result' => $result];
    }
    if ($failure !== null)
    {
      $this->raiseFailure($failure['code']);
    }
    return $result;
  }

  private function raiseFailure(string $code): never
  {
    throw new IntegrationFailure(
      $code, 'Simulated provider interruption; retry according to the operation contract.', true,
      $code === 'RATE_LIMITED' ? 30 : null
    );
  }

  private static function canonicalize(array $value): array
  {
    if (!array_is_list($value))
    {
      ksort($value);
    }
    foreach ($value as &$item)
    {
      if (is_array($item))
      {
        $item = self::canonicalize($item);
      }
    }
    unset($item);
    return $value;
  }
}
