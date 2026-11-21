<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Integration;

use RuntimeException;

final class IntegrationFailure extends RuntimeException
{
  public function __construct(
    public readonly string $errorCode,
    string $message,
    public readonly bool $retryable = false,
    public readonly ?int $retryAfterSeconds = null
  )
  {
    parent::__construct($message);
  }
}
