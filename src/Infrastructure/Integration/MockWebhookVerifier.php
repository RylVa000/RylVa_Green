<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Integration;

use Closure;
use DateTimeImmutable;
use DateTimeZone;
use InvalidArgumentException;
use JsonException;

/** This HMAC envelope is a test protocol, not a vendor implementation. */
final class MockWebhookVerifier
{
  private readonly Closure $clock;

  public function __construct(
    private readonly string $secret,
    private readonly int $toleranceSeconds,
    ?Closure $clock = null
  )
  {
    if (strlen($secret) < 32 || $toleranceSeconds < 1)
    {
      throw new InvalidArgumentException('Supply a test signing secret and explicit timestamp tolerance.');
    }
    $this->clock = $clock ?? static fn (): DateTimeImmutable => new DateTimeImmutable('now', new DateTimeZone('UTC'));
  }

  public function verify(string $rawBody, array $headers): array
  {
    $headers = array_change_key_case($headers, CASE_LOWER);
    $signature = $headers['x-mock-signature'] ?? null;
    if (strlen($rawBody) > 65536 || !is_string($signature)
      || !hash_equals(hash_hmac('sha256', $rawBody, $this->secret), $signature))
    {
      throw new IntegrationFailure('INVALID_SIGNATURE', 'Webhook signature verification failed.');
    }
    try
    {
      $payload = json_decode($rawBody, true, 32, JSON_THROW_ON_ERROR);
    }
    catch (JsonException)
    {
      throw new IntegrationFailure('INVALID_WEBHOOK', 'The signed webhook is not valid JSON.');
    }
    if (!is_array($payload) || array_is_list($payload))
    {
      throw new IntegrationFailure('INVALID_WEBHOOK', 'The signed webhook must be an object.');
    }
    ContractPayload::text($payload, 'eventId');
    $occurredAt = ContractPayload::utcTimestamp($payload, 'occurredAt');
    if (abs(($this->clock)()->getTimestamp() - $occurredAt->getTimestamp()) > $this->toleranceSeconds)
    {
      throw new IntegrationFailure('STALE_WEBHOOK', 'The webhook timestamp is outside the allowed window.');
    }
    return $payload;
  }
}
