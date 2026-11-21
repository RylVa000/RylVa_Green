<?php
declare(strict_types=1);

namespace RylvaGreen\Http;

final class ErrorResponder
{
  public function __construct(private readonly string $projectRoot)
  {
  }

  public function respond(int $status, string $code, string $message, string $requestId, bool $json): Response
  {
    $pages = [403 => 'error-403.html', 404 => 'error-404.html', 500 => 'error-500.html', 503 => 'maintenance.html'];
    if (!$json && isset($pages[$status]))
    {
      $file = $this->projectRoot . '/public/pages/public/' . $pages[$status];
      $html = is_readable($file) ? file_get_contents($file) : false;
      if ($html !== false)
      {
        // Errors may be served at a deeply nested missing URL. Keep existing asset/link resolution intact.
        $html = preg_replace('/<head>/i', "<head>\n    <base href=\"/pages/public/\">", $html, 1) ?? $html;
        return new Response($html, $status, [
          'Content-Type' => 'text/html; charset=utf-8',
          'Cache-Control' => 'no-store',
        ]);
      }
    }
    return Response::json(['error' => ['code' => $code, 'message' => $message, 'requestId' => $requestId]], $status);
  }
}
