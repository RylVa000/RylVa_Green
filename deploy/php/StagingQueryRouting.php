<?php
declare(strict_types=1);

use RylvaGreen\Http\HttpException;
use RylvaGreen\Http\Request;
use RylvaGreen\Http\Response;

final class StagingQueryRouting
{
  public static function request(Request $request): Request
  {
    $route = $request->query['route'] ?? '/';
    if (!is_string($route) || !preg_match('~^/(?!/)[A-Za-z0-9/_.-]*$~D', $route)
      || preg_match('~(?:^|/)\.\.?(?:/|$)~', $route))
    {
      throw new HttpException(400, 'INVALID_ROUTE', 'Alamat halaman tidak valid. Kembali ke Beranda dan coba lagi.');
    }
    $query = $request->query;
    unset($query['route']);
    return new Request($request->method, $route, $query, $request->headers, $request->body);
  }

  public static function href(string $logicalUrl): string
  {
    $parts = parse_url($logicalUrl);
    if ($parts === false || !str_starts_with($logicalUrl, '/') || str_starts_with($logicalUrl, '//'))
    {
      throw new InvalidArgumentException('Query routing accepts local URLs only.');
    }
    $query = [];
    parse_str($parts['query'] ?? '', $query);
    unset($query['route']);
    return '/index.php?' . http_build_query(['route' => $parts['path'] ?? '/', ...$query], '', '&', PHP_QUERY_RFC3986)
      . (isset($parts['fragment']) ? '#' . $parts['fragment'] : '');
  }

  public static function response(Response $response, Request $request): Response
  {
    $headers = $response->headers;
    if (isset($headers['Location']))
    {
      $headers['Location'] = self::href($headers['Location']);
    }
    $body = $response->body;
    if (str_starts_with($headers['Content-Type'] ?? '', 'text/html'))
    {
      $logicalUrl = $request->path . ($request->query !== []
        ? '?' . http_build_query($request->query, '', '&', PHP_QUERY_RFC3986) : '');
      $base = htmlspecialchars(self::href($logicalUrl), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
      $body = preg_replace('/<base\b[^>]*>/i', '', $body) ?? $body;
      $body = preg_replace('/<head>/i', '<head>' . "\n  " . '<base href="' . $base . '">', $body, 1) ?? $body;
    }
    return new Response($body, $response->status, $headers);
  }
}
