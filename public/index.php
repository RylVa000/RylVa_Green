<?php
declare(strict_types=1);

use RylvaGreen\Http\ErrorResponder;
use RylvaGreen\Http\HttpException;
use RylvaGreen\Http\Request;
use RylvaGreen\Http\Response;

ini_set('display_errors', '0');
try
{
  $kernel = require dirname(__DIR__) . '/src/Bootstrap.php';
  $response = $kernel->handle(Request::fromGlobals());
}
catch (Throwable $error)
{
  $requestId = bin2hex(random_bytes(8));
  error_log('request=' . $requestId . ' bootstrap_exception=' . get_class($error));
  $status = $error instanceof HttpException ? $error->status : 500;
  $code = $error instanceof HttpException ? $error->errorCode : 'INTERNAL_ERROR';
  $message = $error instanceof HttpException ? $error->getMessage() : 'Layanan mengalami gangguan. Silakan coba lagi.';
  if (class_exists(ErrorResponder::class))
  {
    $acceptsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')
      || str_starts_with($_SERVER['REQUEST_URI'] ?? '', '/api/');
    $response = (new ErrorResponder(dirname(__DIR__)))->respond($status, $code, $message, $requestId, $acceptsJson);
    $response = $response->withHeader('X-Request-Id', $requestId);
  }
  else
  {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'HEAD')
    {
      echo '{"error":{"code":"INTERNAL_ERROR","message":"Layanan belum tersedia."}}';
    }
    return;
  }
}
$response->send(($_SERVER['REQUEST_METHOD'] ?? '') === 'HEAD');
