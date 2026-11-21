<?php
declare(strict_types=1);

namespace RylvaGreen\Http;

use Throwable;

final class Kernel
{
  public function __construct(private readonly array $routes, private readonly ErrorResponder $errors)
  {
  }

  public function handle(Request $request): Response
  {
    $requestId = bin2hex(random_bytes(8));
    try
    {
      $response = $this->dispatch($request, $requestId);
    }
    catch (HttpException $error)
    {
      $response = $this->errors->respond(
        $error->status, $error->errorCode, $error->getMessage(), $requestId, $request->prefersJson()
      );
    }
    catch (Throwable $error)
    {
      error_log('request=' . $requestId . ' exception=' . get_class($error));
      $response = $this->errors->respond(
        500, 'INTERNAL_ERROR', 'Layanan mengalami gangguan. Silakan coba lagi.', $requestId, $request->prefersJson()
      );
    }
    return $response->withHeader('X-Request-Id', $requestId);
  }

  private function dispatch(Request $request, string $requestId): Response
  {
    $allowed = [];
    $method = $request->method === 'HEAD' ? 'GET' : $request->method;
    foreach ($this->routes as $route)
    {
      if ($route['path'] !== $request->path)
      {
        continue;
      }
      $allowed[] = $route['method'];
      if ($method === $route['method'])
      {
        return ($route['handler'])($request);
      }
    }
    if ($allowed)
    {
      if (in_array('GET', $allowed, true))
      {
        $allowed[] = 'HEAD';
      }
      return Response::json(['error' => [
        'code' => 'METHOD_NOT_ALLOWED',
        'message' => 'Metode permintaan tidak tersedia untuk alamat ini.',
        'requestId' => $requestId,
      ]], 405)->withHeader('Allow', implode(', ', array_unique($allowed)));
    }
    throw new HttpException(404, 'NOT_FOUND', 'Halaman atau layanan tidak ditemukan. Periksa alamatnya.');
  }
}
