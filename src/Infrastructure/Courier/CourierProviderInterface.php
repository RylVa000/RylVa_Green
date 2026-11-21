<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Courier;

/** Provider contract v1; shapes and failure/retry rules: docs/architecture/integration-contracts.md. */
interface CourierProviderInterface
{
  /** @return list<array{provider: string, isSimulation: bool, quoteReference: string, serviceCode: string, serviceType: string, feeRupiah: int, currency: string, validUntil: string}> */
  public function quote(array $request): array;

  public function createShipment(array $request): array;

  public function track(string $providerReference): array;

  public function verifyWebhook(string $rawBody, array $headers): array;
}
