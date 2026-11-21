<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Courier;

use Closure;
use DateTimeImmutable;
use DateTimeZone;
use RylvaGreen\Infrastructure\Integration\ContractPayload;
use RylvaGreen\Infrastructure\Integration\IntegrationFailure;
use RylvaGreen\Infrastructure\Integration\MockProviderState;
use RylvaGreen\Infrastructure\Integration\MockWebhookVerifier;

final class MockCourierProviderAdapter implements CourierProviderInterface
{
  private const SHIPPING_STATUSES = ['BELUM_DISERAHKAN', 'DALAM_PENGIRIMAN', 'TERKENDALA', 'TERKIRIM', 'DIKEMBALIKAN'];
  private readonly MockProviderState $state;
  private readonly Closure $clock;
  private array $quotes = [];
  private array $shipments = [];

  /** Services/prices/expiry are explicit test fixtures, never claimed as real coverage or tariffs. */
  public function __construct(
    string $environment,
    private readonly MockWebhookVerifier $webhooks,
    private readonly array $services = [],
    ?Closure $clock = null
  )
  {
    $this->state = new MockProviderState($environment);
    $this->clock = $clock ?? static fn (): DateTimeImmutable => new DateTimeImmutable('now', new DateTimeZone('UTC'));
    foreach ($services as $service)
    {
      ContractPayload::text($service, 'serviceCode');
      ContractPayload::choice($service, 'serviceType', ['INSTAN', 'SAME_DAY', 'REGULER']);
      ContractPayload::utcTimestamp($service, 'validUntil');
      if (!isset($service['feeRupiah']) || !is_int($service['feeRupiah']) || $service['feeRupiah'] < 0)
      {
        throw new IntegrationFailure('INVALID_REQUEST', 'Fixture fees must be non-negative integer rupiah.');
      }
    }
  }

  public function quote(array $request): array
  {
    ContractPayload::text($request, 'originArea');
    ContractPayload::text($request, 'destinationArea');
    ContractPayload::positiveInteger($request, 'weightGrams');
    $handling = ContractPayload::choice($request, 'handlingType', ['MUDAH_LAYU', 'TAHAN_LAMA']);
    return $this->state->run('quote', null, $request, function () use ($request, $handling): array
    {
      $results = [];
      foreach ($this->services as $service)
      {
        if (ContractPayload::utcTimestamp($service, 'validUntil')->getTimestamp() <= ($this->clock)()->getTimestamp())
        {
          continue;
        }
        if ($handling === 'MUDAH_LAYU' && $service['serviceType'] === 'REGULER')
        {
          continue;
        }
        $quote = [
          ...$service, 'provider' => 'mock', 'isSimulation' => true, 'currency' => 'IDR',
          'quoteReference' => 'mock_quote_' . substr(hash('sha256', serialize([$request, $service])), 0, 24),
        ];
        $this->quotes[$quote['quoteReference']] = $quote;
        $results[] = $quote;
      }
      return $results;
    });
  }

  public function createShipment(array $request): array
  {
    $key = ContractPayload::text($request, 'idempotencyKey');
    $quoteReference = ContractPayload::text($request, 'quoteReference');
    $orderReference = ContractPayload::text($request, 'orderReference');
    ContractPayload::text($request, 'recipientReference');
    return $this->state->run('createShipment', $key, $request, function () use ($key, $quoteReference, $orderReference): array
    {
      $quote = $this->quotes[$quoteReference]
        ?? throw new IntegrationFailure('QUOTE_UNAVAILABLE', 'Request a new quote before creating a shipment.');
      if (ContractPayload::utcTimestamp($quote, 'validUntil')->getTimestamp() <= ($this->clock)()->getTimestamp())
      {
        throw new IntegrationFailure('QUOTE_EXPIRED', 'Request a new quote and confirm the current cost.');
      }
      $reference = 'mock_shipment_' . substr(hash('sha256', $key), 0, 24);
      $shipment = [
        'provider' => 'mock', 'isSimulation' => true, 'providerReference' => $reference,
        'orderReference' => $orderReference, 'quoteReference' => $quoteReference,
        'serviceCode' => $quote['serviceCode'], 'serviceType' => $quote['serviceType'],
        'feeRupiah' => $quote['feeRupiah'], 'currency' => 'IDR',
        'trackingReference' => 'mock_tracking_' . substr(hash('sha256', $key), 0, 16),
        'status' => 'BELUM_DISERAHKAN',
      ];
      $this->shipments[$reference] = $shipment;
      return $shipment;
    });
  }

  public function track(string $providerReference): array
  {
    return $this->state->run('track', null, [], function () use ($providerReference): array
    {
      return $this->shipments[$providerReference]
        ?? throw new IntegrationFailure('NOT_FOUND', 'The mock shipment reference was not found.');
    });
  }

  public function verifyWebhook(string $rawBody, array $headers): array
  {
    $event = $this->webhooks->verify($rawBody, $headers);
    ContractPayload::choice($event, 'eventType', ['shipment.updated']);
    ContractPayload::text($event, 'providerReference');
    ContractPayload::choice($event, 'status', self::SHIPPING_STATUSES);
    return [...$event, 'provider' => 'mock', 'isSimulation' => true];
  }

  public function simulateStatus(string $providerReference, string $status): void
  {
    ContractPayload::choice(['status' => $status], 'status', self::SHIPPING_STATUSES);
    $this->track($providerReference);
    $this->shipments[$providerReference]['status'] = $status;
  }

  public function failNext(string $operation, string $code, bool $afterCommit = false): void
  {
    $this->state->failNext($operation, $code, $afterCommit);
  }
}
