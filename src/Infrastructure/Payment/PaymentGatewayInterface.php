<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Payment;

/** Provider contract v1; shapes and failure/retry rules: docs/architecture/integration-contracts.md. */
interface PaymentGatewayInterface
{
  /** @return array{provider: string, isSimulation: bool, providerReference: string, orderReference: string, amountRupiah: int, currency: string, method: string, status: string, expiresAt: string} */
  public function createPayment(array $request): array;

  public function getStatus(string $providerReference): array;

  public function requestRefund(array $request): array;

  /** Verifies the original bytes before parsing; never changes the order/payment database. */
  public function verifyWebhook(string $rawBody, array $headers): array;
}
