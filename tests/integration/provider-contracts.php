<?php
declare(strict_types=1);

use RylvaGreen\Infrastructure\Courier\CourierProviderInterface;
use RylvaGreen\Infrastructure\Courier\MockCourierProviderAdapter;
use RylvaGreen\Infrastructure\Integration\IntegrationFailure;
use RylvaGreen\Infrastructure\Integration\MockWebhookVerifier;
use RylvaGreen\Infrastructure\Payment\MockPaymentGatewayAdapter;
use RylvaGreen\Infrastructure\Payment\PaymentGatewayInterface;

require dirname(__DIR__, 2) . '/vendor/autoload.php';
$checks = [];
$check = static function (bool $condition, string $label) use (&$checks): void
{
  if (!$condition)
  {
    throw new RuntimeException('FAILED: ' . $label);
  }
  $checks[] = $label;
};
$expectFailure = static function (Closure $operation, string $code, bool $retryable = false) use ($check): IntegrationFailure
{
  try
  {
    $operation();
  }
  catch (IntegrationFailure $failure)
  {
    $check($failure->errorCode === $code && $failure->retryable === $retryable,
      'Provider failure: expected ' . $code . ', received ' . $failure->errorCode);
    return $failure;
  }
  throw new RuntimeException('Expected provider failure: ' . $code);
};

try
{
  // Explicit synthetic data; no email, payment, courier network call or database mutation occurs.
  $secret = 'provider-contract-test-signing-secret-only';
  $now = new DateTimeImmutable('2026-11-21T12:00:00Z');
  $webhooks = new MockWebhookVerifier($secret, 300, static fn (): DateTimeImmutable => $now);
  foreach (['production', 'staging'] as $environment)
  {
    foreach ([MockPaymentGatewayAdapter::class, MockCourierProviderAdapter::class] as $adapterClass)
    {
      try
      {
        new $adapterClass($environment, $webhooks);
        throw new RuntimeException('Mock provider accepted an unsupported environment.');
      }
      catch (LogicException)
      {
        $check(true, 'Mocks reject environment ' . $environment . ': ' . $adapterClass);
      }
    }
  }
  $payment = new MockPaymentGatewayAdapter('testing', $webhooks);
  $check($payment instanceof PaymentGatewayInterface, 'Mock payment implements the vendor-neutral interface');
  $request = [
    'idempotencyKey' => 'test-payment-1', 'orderReference' => 'TEST-ORDER-1',
    'amountRupiah' => 125000, 'method' => 'QRIS',
    'expiresAt' => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->modify('+1 day')->format('Y-m-d\TH:i:s\Z'),
  ];
  $created = $payment->createPayment($request);
  $reference = $created['providerReference'];
  $check($created['isSimulation'] && $created['provider'] === 'mock'
    && $created['currency'] === 'IDR' && $created['status'] === 'MENUNGGU', 'Payment creation is explicitly simulated and initially pending');
  $check(str_starts_with($reference, 'mock_') && !isset($created['paymentUrl'])
    && !isset($created['qrPayload']), 'Mock payment does not publish real payment instructions');
  $check($payment->createPayment(array_reverse($request, true)) === $created, 'Reordered fields retain one idempotent payment result');
  $expectFailure(static fn () => $payment->createPayment([...$request, 'amountRupiah' => 1]), 'IDEMPOTENCY_CONFLICT');
  foreach ([0, -1, 1.5, '125000'] as $invalidAmount)
  {
    $expectFailure(static fn () => $payment->createPayment([...$request, 'amountRupiah' => $invalidAmount]), 'INVALID_REQUEST');
  }
  $expectFailure(static fn () => $payment->createPayment([...$request, 'currency' => 'USD']), 'INVALID_REQUEST');
  $expectFailure(static fn () => $payment->createPayment([...$request, 'method' => 'COD']), 'INVALID_REQUEST');
  $expectFailure(static fn () => $payment->createPayment([...$request, 'expiresAt' => '2030-02-30T00:00:00Z']), 'INVALID_REQUEST');
  $expectFailure(static fn () => $payment->createPayment([
    ...$request, 'idempotencyKey' => 'test-expired-payment', 'expiresAt' => '2020-01-01T00:00:00Z',
  ]), 'INVALID_REQUEST');
  $expectFailure(static fn () => $payment->getStatus('missing'), 'NOT_FOUND');
  $payment->failNext('createPayment', 'TIMEOUT', true);
  $lostRequest = [...$request, 'idempotencyKey' => 'test-payment-response-lost'];
  $expectFailure(static fn () => $payment->createPayment($lostRequest), 'TIMEOUT', true);
  $recovered = $payment->createPayment($lostRequest);
  $check($recovered === $payment->createPayment($lostRequest), 'Retry after a lost creation response returns the original provider record');
  $payment->failNext('getStatus', 'UNAVAILABLE');
  $expectFailure(static fn () => $payment->getStatus($reference), 'UNAVAILABLE', true);
  $check($payment->getStatus($reference)['status'] === 'MENUNGGU', 'Read recovery retains payment state');
  $payment->failNext('getStatus', 'RATE_LIMITED');
  $limited = $expectFailure(static fn () => $payment->getStatus($reference), 'RATE_LIMITED', true);
  $check($limited->retryAfterSeconds !== null && $limited->retryAfterSeconds > 0, 'Rate limiting provides a retry delay');
  $refund = [
    'idempotencyKey' => 'test-refund-1', 'providerReference' => $reference,
    'amountRupiah' => 25000, 'reason' => 'Synthetic refund fixture',
  ];
  $expectFailure(static fn () => $payment->requestRefund($refund), 'REFUND_REJECTED');
  $payment->simulateStatus($reference, 'BERHASIL');
  $check($payment->createPayment($request)['status'] === 'MENUNGGU'
    && $payment->getStatus($reference)['status'] === 'BERHASIL', 'A creation replay retains its original receipt while status reads return the latest provider state');
  $expectFailure(static fn () => $payment->requestRefund([...$refund, 'currency' => 'USD']), 'INVALID_REQUEST');
  $payment->failNext('requestRefund', 'TIMEOUT', true);
  $expectFailure(static fn () => $payment->requestRefund($refund), 'TIMEOUT', true);
  $refunded = $payment->requestRefund($refund);
  $check($refunded['status'] === 'DIPROSES' && $refunded['isSimulation'], 'Refund acceptance does not falsely report completed transfer');
  $check($payment->requestRefund($refund) === $refunded, 'A repeated refund request does not consume the amount twice');
  $expectFailure(static fn () => $payment->requestRefund([...$refund, 'amountRupiah' => 26000]), 'IDEMPOTENCY_CONFLICT');
  $expectFailure(static fn () => $payment->requestRefund([...$refund, 'idempotencyKey' => 'too-much', 'amountRupiah' => 100001]), 'REFUND_REJECTED');
  $check($payment->requestRefund([...$refund, 'idempotencyKey' => 'remainder', 'amountRupiah' => 100000])['amountRupiah'] === 100000, 'Remaining refund amount remains correct after a lost response');

  $event = [
    'eventId' => 'test-event-1', 'eventType' => 'payment.updated', 'occurredAt' => '2026-11-21T12:00:00Z',
    'providerReference' => $recovered['providerReference'], 'orderReference' => 'TEST-ORDER-1',
    'amountRupiah' => 125000, 'currency' => 'IDR', 'status' => 'BERHASIL',
  ];
  $raw = json_encode($event, JSON_THROW_ON_ERROR);
  $signature = ['X-Mock-Signature' => hash_hmac('sha256', $raw, $secret)];
  $verified = $payment->verifyWebhook($raw, $signature);
  $check($verified['eventId'] === 'test-event-1' && $verified['isSimulation'], 'Signed raw webhook is verified and marked as simulation');
  $check($payment->getStatus($recovered['providerReference'])['status'] === 'MENUNGGU', 'Verifying an event does not mutate provider/payment/order state');
  $expectFailure(static fn () => $payment->verifyWebhook($raw . ' ', $signature), 'INVALID_SIGNATURE');
  $expectFailure(static fn () => $payment->verifyWebhook($raw, []), 'INVALID_SIGNATURE');
  $expectFailure(static fn () => $payment->verifyWebhook('{', ['x-mock-signature' => hash_hmac('sha256', '{', $secret)]), 'INVALID_WEBHOOK');
  foreach (['2026-11-21T11:00:00Z', '2026-11-21T13:00:00Z'] as $timestamp)
  {
    $stale = json_encode([...$event, 'occurredAt' => $timestamp], JSON_THROW_ON_ERROR);
    $expectFailure(static fn () => $payment->verifyWebhook($stale,
      ['x-mock-signature' => hash_hmac('sha256', $stale, $secret)]), 'STALE_WEBHOOK');
  }

  $services = [
    ['serviceCode' => 'TEST-INSTANT', 'serviceType' => 'INSTAN', 'feeRupiah' => 20000, 'validUntil' => $request['expiresAt']],
    ['serviceCode' => 'TEST-REGULAR', 'serviceType' => 'REGULER', 'feeRupiah' => 10000, 'validUntil' => $request['expiresAt']],
  ];
  $courier = new MockCourierProviderAdapter('testing', $webhooks, $services);
  $check($courier instanceof CourierProviderInterface, 'Mock courier implements the vendor-neutral interface');
  $quoteRequest = ['originArea' => 'TEST-ORIGIN', 'destinationArea' => 'TEST-DESTINATION', 'weightGrams' => 1000, 'handlingType' => 'TAHAN_LAMA'];
  $quotes = $courier->quote($quoteRequest);
  $check(count($quotes) === 2 && $quotes[0]['isSimulation'], 'Courier rates are explicit synthetic fixtures');
  $check(count($courier->quote([...$quoteRequest, 'handlingType' => 'MUDAH_LAYU'])) === 1, 'Perishable goods do not receive the regular-service fixture');
  $check((new MockCourierProviderAdapter('testing', $webhooks))->quote($quoteRequest) === [], 'No configured fixture returns no services instead of invented coverage');
  $expectFailure(static fn () => $courier->quote([...$quoteRequest, 'weightGrams' => 0]), 'INVALID_REQUEST');
  $courier->failNext('quote', 'UNAVAILABLE');
  $expectFailure(static fn () => $courier->quote($quoteRequest), 'UNAVAILABLE', true);
  $shipmentRequest = [
    'idempotencyKey' => 'test-shipment-1', 'quoteReference' => $quotes[0]['quoteReference'],
    'orderReference' => 'TEST-ORDER-1', 'recipientReference' => 'TEST-RECIPIENT-1',
  ];
  $courier->failNext('createShipment', 'TIMEOUT', true);
  $expectFailure(static fn () => $courier->createShipment($shipmentRequest), 'TIMEOUT', true);
  $shipment = $courier->createShipment($shipmentRequest);
  $check($shipment === $courier->createShipment($shipmentRequest), 'Shipment retry after a lost response does not create a second shipment');
  $check($shipment['status'] === 'BELUM_DISERAHKAN' && str_starts_with($shipment['trackingReference'], 'mock_'), 'New shipment has an explicit simulated tracking reference');
  $expectFailure(static fn () => $courier->createShipment([...$shipmentRequest, 'orderReference' => 'OTHER']), 'IDEMPOTENCY_CONFLICT');
  $expectFailure(static fn () => $courier->createShipment([...$shipmentRequest, 'idempotencyKey' => 'missing-quote', 'quoteReference' => 'missing']), 'QUOTE_UNAVAILABLE');
  $courier->simulateStatus($shipment['providerReference'], 'TERKENDALA');
  $check($courier->track($shipment['providerReference'])['status'] === 'TERKENDALA', 'Tracking scenarios preserve shipment status as a separate concept');
  $courier->failNext('track', 'RATE_LIMITED');
  $expectFailure(static fn () => $courier->track($shipment['providerReference']), 'RATE_LIMITED', true);
  $check($courier->track($shipment['providerReference'])['status'] === 'TERKENDALA', 'Tracking failure recovery retains shipment state');
  $expectFailure(static fn () => $courier->track('missing'), 'NOT_FOUND');
  $quoteClock = new DateTimeImmutable('2026-11-21T12:00:00Z');
  $expiredCourier = new MockCourierProviderAdapter('testing', $webhooks, [$services[0]],
    static function () use (&$quoteClock): DateTimeImmutable
    {
      return $quoteClock;
    });
  $expiredQuote = $expiredCourier->quote($quoteRequest)[0];
  $quoteClock = new DateTimeImmutable($services[0]['validUntil']);
  $expectFailure(static fn () => $expiredCourier->createShipment([...$shipmentRequest, 'quoteReference' => $expiredQuote['quoteReference']]), 'QUOTE_EXPIRED');
  $check($expiredCourier->quote($quoteRequest) === [], 'Expired service fixtures are not offered again as fresh quotes');
  $courierEvent = json_encode([
    'eventId' => 'test-courier-event', 'eventType' => 'shipment.updated', 'occurredAt' => '2026-11-21T12:00:00Z',
    'providerReference' => $shipment['providerReference'], 'status' => 'TERKIRIM',
  ], JSON_THROW_ON_ERROR);
  $check($courier->verifyWebhook($courierEvent, ['x-mock-signature' => hash_hmac('sha256', $courierEvent, $secret)])['isSimulation'], 'Courier webhook verifies the signed fixture');
  $check($courier->track($shipment['providerReference'])['status'] === 'TERKENDALA', 'Courier webhook verification does not bypass the application state machine');

  $report = ['passed' => true, 'count' => count($checks), 'checks' => $checks];
  $reportDirectory = dirname(__DIR__, 2) . '/storage/reports/foundation';
  if (!is_dir($reportDirectory))
  {
    mkdir($reportDirectory, 0700, true);
  }
  file_put_contents($reportDirectory . '/provider-contracts.json', json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
  echo json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
}
catch (Throwable $error)
{
  fwrite(STDERR, get_class($error) . ': ' . $error->getMessage() . PHP_EOL);
  exit(1);
}
