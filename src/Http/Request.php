<?php
declare(strict_types=1);

namespace RylvaGreen\Http;

use JsonException;

final class Request
{
  public function __construct(
    public readonly string $method,
    public readonly string $path,
    public readonly array $query = [],
    public readonly array $headers = [],
    public readonly string $body = ''
  )
  {
  }

  public static function fromGlobals(): self
  {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $target = $_SERVER['REQUEST_URI'] ?? '/';
    if (!preg_match('/^[A-Z]+$/', $method) || !str_starts_with($target, '/')
      || preg_match('/%(?![0-9A-Fa-f]{2})/', $target))
    {
      throw new HttpException(400, 'INVALID_REQUEST', 'Permintaan tidak valid. Periksa alamat dan coba lagi.');
    }
    $path = explode('?', $target, 2)[0];
    $path = rawurldecode($path);
    if (preg_match('//u', $path) !== 1 || preg_match('/[\x00-\x1F\x7F\\\\]/', $path)
      || preg_match('~(?:^|/)\.\.?(?:/|$)~', $path))
    {
      throw new HttpException(400, 'INVALID_PATH', 'Alamat permintaan tidak valid.');
    }
    $headers = [];
    foreach ($_SERVER as $key => $value)
    {
      if (str_starts_with($key, 'HTTP_') && is_string($value))
      {
        $headers[strtolower(str_replace('_', '-', substr($key, 5)))] = $value;
      }
    }
    if (isset($_SERVER['CONTENT_TYPE']))
    {
      $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
    }
    return new self($method, $path, $_GET, $headers, file_get_contents('php://input') ?: '');
  }

  public function prefersJson(): bool
  {
    return str_starts_with($this->path, '/api/')
      || str_contains(strtolower($this->headers['accept'] ?? ''), 'application/json')
      || $this->path === '/health';
  }

  public function jsonObject(): array
  {
    $contentType = strtolower(trim(explode(';', $this->headers['content-type'] ?? '')[0]));
    if ($contentType !== 'application/json')
    {
      throw new HttpException(415, 'UNSUPPORTED_MEDIA_TYPE', 'Gunakan Content-Type application/json.');
    }
    try
    {
      $value = json_decode($this->body, false, 512, JSON_THROW_ON_ERROR);
    }
    catch (JsonException)
    {
      throw new HttpException(400, 'INVALID_JSON', 'Isi JSON tidak valid. Periksa format dan coba lagi.');
    }
    if (!$value instanceof \stdClass)
    {
      throw new HttpException(422, 'INVALID_PAYLOAD', 'Isi permintaan harus berupa objek JSON.');
    }
    return json_decode($this->body, true, 512, JSON_THROW_ON_ERROR);
  }
}
