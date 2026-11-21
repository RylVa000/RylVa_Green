<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Integration;

use DateTimeImmutable;
use DateTimeZone;

final class ContractPayload
{
  public static function text(array $payload, string $field): string
  {
    $value = $payload[$field] ?? null;
    if (!is_string($value) || trim($value) === '' || strlen($value) > 200
      || preg_match('/[\x00-\x1F\x7F]/', $value))
    {
      throw new IntegrationFailure('INVALID_REQUEST', 'Invalid integration field: ' . $field . '.');
    }
    return $value;
  }

  public static function positiveInteger(array $payload, string $field): int
  {
    $value = $payload[$field] ?? null;
    if (!is_int($value) || $value < 1)
    {
      throw new IntegrationFailure('INVALID_REQUEST', $field . ' must be a positive integer.');
    }
    return $value;
  }

  public static function choice(array $payload, string $field, array $allowed): string
  {
    $value = self::text($payload, $field);
    if (!in_array($value, $allowed, true))
    {
      throw new IntegrationFailure('INVALID_REQUEST', 'Unsupported integration field: ' . $field . '.');
    }
    return $value;
  }

  public static function utcTimestamp(array $payload, string $field): DateTimeImmutable
  {
    $value = self::text($payload, $field);
    $date = DateTimeImmutable::createFromFormat('!Y-m-d\TH:i:s\Z', $value, new DateTimeZone('UTC'));
    if ($date === false || $date->format('Y-m-d\TH:i:s\Z') !== $value)
    {
      throw new IntegrationFailure('INVALID_REQUEST', $field . ' must be a valid UTC timestamp ending in Z.');
    }
    return $date;
  }
}
