<?php
declare(strict_types=1);

namespace RylvaGreen\Http;

use InvalidArgumentException;

final class Response
{
  public function __construct(
    public readonly string $body,
    public readonly int $status = 200,
    public readonly array $headers = []
  )
  {
    if ($status < 100 || $status > 599)
    {
      throw new InvalidArgumentException('Invalid HTTP status.');
    }
    foreach ($headers as $name => $value)
    {
      if (!preg_match('/^[A-Za-z0-9-]+$/', $name) || strpbrk($value, "\r\n") !== false)
      {
        throw new InvalidArgumentException('Invalid response header.');
      }
    }
  }

  public static function json(array $payload, int $status = 200): self
  {
    return new self(
      json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
      $status,
      ['Content-Type' => 'application/json; charset=utf-8', 'Cache-Control' => 'no-store']
    );
  }

  public static function redirect(string $path): self
  {
    if (!str_starts_with($path, '/') || str_starts_with($path, '//') || strpbrk($path, "\r\n\\") !== false)
    {
      throw new InvalidArgumentException('Redirects must use a local absolute path.');
    }
    return new self('', 302, ['Location' => $path, 'Cache-Control' => 'no-store']);
  }

  public function withHeader(string $name, string $value): self
  {
    return new self($this->body, $this->status, [...$this->headers, $name => $value]);
  }

  public function send(bool $headOnly = false): void
  {
    header_remove('X-Powered-By');
    http_response_code($this->status);
    foreach ($this->headers as $name => $value)
    {
      header($name . ': ' . $value, true);
    }
    header('X-Content-Type-Options: nosniff');
    if (!$headOnly)
    {
      echo $this->body;
    }
  }
}
