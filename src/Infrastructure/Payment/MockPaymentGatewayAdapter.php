<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Payment;

use RylvaGreen\Infrastructure\Integration\ContractPayload;
use RylvaGreen\Infrastructure\Integration\IntegrationFailure;
use RylvaGreen\Infrastructure\Integration\MockProviderState;
use RylvaGreen\Infrastructure\Integration\MockWebhookVerifier;

final class MockPaymentGatewayAdapter implements PaymentGatewayInterface
{
  private const PAYMENT_STATUSES = ['MENUNGGU', 'BERHASIL', 'GAGAL', 'KEDALUWARSA', 'DIBATALKAN'];
  private readonly MockProviderState $state;
  private array $transactions = [];
  private array $refundedAmounts = [];

  public function __construct(string $environment, private readonly MockWebhookVerifier $webhooks)
  {
    $this->state = new MockProviderState($environment);
  }

  public function createPayment(array $request): array
  {
    $key = ContractPayload::text($request, 'idempotencyKey');
    $orderReference = ContractPayload::text($request, 'orderReference');
    $amount = ContractPayload::positiveInteger($request, 'amountRupiah');
    $method = ContractPayload::choice($request, 'method', ['QRIS', 'E_WALLET', 'TRANSFER_BANK', 'VIRTUAL_ACCOUNT']);
    ContractPayload::utcTimestamp($request, 'expiresAt');
    if (($request['currency'] ?? 'IDR') !== 'IDR')
    {
      throw new IntegrationFailure('INVALID_REQUEST', 'Only IDR is supported by this store contract.');
    }
    return $this->state->run('createPayment', $key, $request, function () use ($key, $orderReference, $amount, $method, $request): array
    {
      if (ContractPayload::utcTimestamp($request, 'expiresAt')->getTimestamp() <= time())
      {
        throw new IntegrationFailure('INVALID_REQUEST', 'The requested payment expiry must be in the future.');
      }
      $reference = 'mock_payment_' . substr(hash('sha256', $key), 0, 24);
      $transaction = [
        'provider' => 'mock', 'isSimulation' => true, 'providerReference' => $reference,
        'orderReference' => $orderReference, 'amountRupiah' => $amount, 'currency' => 'IDR',
        'method' => $method, 'status' => 'MENUNGGU', 'expiresAt' => $request['expiresAt'],
      ];
      $this->transactions[$reference] = $transaction;
      return $transaction;
    });
  }

  public function getStatus(string $providerReference): array
  {
    return $this->state->run('getStatus', null, [], function () use ($providerReference): array
    {
      return $this->transactions[$providerReference]
        ?? throw new IntegrationFailure('NOT_FOUND', 'The mock payment reference was not found.');
    });
  }

  public function requestRefund(array $request): array
  {
    $key = ContractPayload::text($request, 'idempotencyKey');
    $reference = ContractPayload::text($request, 'providerReference');
    $amount = ContractPayload::positiveInteger($request, 'amountRupiah');
    ContractPayload::text($request, 'reason');
    if (($request['currency'] ?? 'IDR') !== 'IDR')
    {
      throw new IntegrationFailure('INVALID_REQUEST', 'Only IDR is supported by this store contract.');
    }
    return $this->state->run('requestRefund', $key, $request, function () use ($key, $reference, $amount): array
    {
      $payment = $this->transactions[$reference]
        ?? throw new IntegrationFailure('NOT_FOUND', 'The mock payment reference was not found.');
      $alreadyRefunded = $this->refundedAmounts[$reference] ?? 0;
      if ($payment['status'] !== 'BERHASIL' || $amount > $payment['amountRupiah'] - $alreadyRefunded)
      {
        throw new IntegrationFailure('REFUND_REJECTED', 'The payment or remaining refundable amount does not allow this request.');
      }
      $this->refundedAmounts[$reference] = $alreadyRefunded + $amount;
      return [
        'provider' => 'mock', 'isSimulation' => true,
        'refundReference' => 'mock_refund_' . substr(hash('sha256', $key), 0, 24),
        'providerReference' => $reference, 'amountRupiah' => $amount, 'currency' => 'IDR', 'status' => 'DIPROSES',
      ];
    });
  }

  public function verifyWebhook(string $rawBody, array $headers): array
  {
    $event = $this->webhooks->verify($rawBody, $headers);
    ContractPayload::choice($event, 'eventType', ['payment.updated']);
    ContractPayload::text($event, 'providerReference');
    ContractPayload::text($event, 'orderReference');
    ContractPayload::positiveInteger($event, 'amountRupiah');
    ContractPayload::choice($event, 'currency', ['IDR']);
    ContractPayload::choice($event, 'status', self::PAYMENT_STATUSES);
    return [...$event, 'provider' => 'mock', 'isSimulation' => true];
  }

  /** Development controls; these are deliberately absent from the provider interface and HTTP routes. */
  public function simulateStatus(string $providerReference, string $status): void
  {
    ContractPayload::choice(['status' => $status], 'status', self::PAYMENT_STATUSES);
    $this->getStatus($providerReference);
    $this->transactions[$providerReference]['status'] = $status;
  }

  public function failNext(string $operation, string $code, bool $afterCommit = false): void
  {
    $this->state->failNext($operation, $code, $afterCommit);
  }
}
