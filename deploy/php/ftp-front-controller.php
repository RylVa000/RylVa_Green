<?php
declare(strict_types=1);

// Persistent staging entry point: review access, existing public files, and the normal application kernel.
// No installer, server-information endpoint, SQL execution, or temporary diagnostic endpoint is provided.
use RylvaGreen\Http\ErrorResponder;
use RylvaGreen\Http\HttpException;
use RylvaGreen\Http\Request;
use RylvaGreen\Http\Response;

ini_set('display_errors', '0');
$releaseRoot = dirname(__DIR__) . '/_rylva_green_private/releases/__RYLVA_RELEASE_ID__';
ini_set('error_log', $releaseRoot . '/storage/logs/application.log');
header_remove('X-Powered-By');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Cache-Control: no-store');
$request = null;

try
{
  $access = require $releaseRoot . '/config/staging-access.php';
  $username = $_SERVER['PHP_AUTH_USER'] ?? '';
  $password = $_SERVER['PHP_AUTH_PW'] ?? '';
  $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
  if ($username === '' && preg_match('/^Basic\s+(.+)$/i', $authorization, $matches))
  {
    $decoded = base64_decode($matches[1], true);
    if (is_string($decoded) && str_contains($decoded, ':'))
    {
      [$username, $password] = explode(':', $decoded, 2);
    }
  }
  if (!hash_equals($access['username'], $username) || !password_verify($password, $access['passwordHash']))
  {
    http_response_code(401);
    header('WWW-Authenticate: Basic realm="RylVa staging", charset="UTF-8"');
    header('Content-Type: text/plain; charset=utf-8');
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'HEAD')
    {
      echo 'Masuk dengan akun peninjau staging.';
    }
    return;
  }
  require_once $releaseRoot . '/vendor/autoload.php';
  require_once $releaseRoot . '/deploy/php/StagingQueryRouting.php';
  $request = StagingQueryRouting::request(Request::fromGlobals());
  if (preg_match('~(?:^|/)\.(?!well-known(?:/|$))~', $request->path))
  {
    throw new HttpException(403, 'ACCESS_DENIED', 'Akses tidak diizinkan.');
  }
  $errorPages = ['/pages/public/error-403.html', '/pages/public/error-404.html',
    '/pages/public/error-500.html', '/pages/public/maintenance.html'];
  $publicRoot = realpath($releaseRoot . '/public');
  $file = realpath($releaseRoot . '/public' . $request->path);
  if ($file === false && str_starts_with($request->path, '/assets/'))
  {
    $publicRoot = realpath(__DIR__);
    $file = realpath(__DIR__ . $request->path);
  }
  $mimeTypes = [
    'html' => 'text/html; charset=utf-8', 'css' => 'text/css; charset=utf-8',
    'js' => 'application/javascript; charset=utf-8', 'json' => 'application/json; charset=utf-8',
    'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
    'webp' => 'image/webp', 'avif' => 'image/avif', 'gif' => 'image/gif', 'ico' => 'image/x-icon',
    'woff' => 'font/woff', 'woff2' => 'font/woff2', 'ttf' => 'font/ttf',
    'txt' => 'text/plain; charset=utf-8', 'xml' => 'application/xml',
    'webmanifest' => 'application/manifest+json', 'mp4' => 'video/mp4', 'webm' => 'video/webm',
  ];
  if ($file !== false && is_file($file) && $request->path !== '/index.php'
    && !in_array($request->path, $errorPages, true))
  {
    $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (!str_starts_with($file, $publicRoot . DIRECTORY_SEPARATOR) || !isset($mimeTypes[$extension]))
    {
      throw new HttpException(403, 'ACCESS_DENIED', 'Akses tidak diizinkan.');
    }
    if (!in_array($request->method, ['GET', 'HEAD'], true))
    {
      Response::json(['error' => ['code' => 'METHOD_NOT_ALLOWED', 'message' => 'Gunakan GET atau HEAD.']], 405)
        ->withHeader('Allow', 'GET, HEAD')->send();
      return;
    }
    $response = new Response(file_get_contents($file), 200, [
      'Content-Type' => $mimeTypes[$extension], 'Cache-Control' => 'no-store',
    ]);
    StagingQueryRouting::response($response, $request)->send($request->method === 'HEAD');
    return;
  }
  if ($file !== false && is_dir($file) && $request->path !== '/')
  {
    throw new HttpException(403, 'ACCESS_DENIED', 'Daftar direktori tidak tersedia.');
  }
  $kernel = require $releaseRoot . '/src/Bootstrap.php';
  StagingQueryRouting::response($kernel->handle($request), $request)->send($request->method === 'HEAD');
}
catch (Throwable $error)
{
  $requestId = bin2hex(random_bytes(8));
  error_log('request=' . $requestId . ' staging_exception=' . get_class($error));
  $status = $error instanceof HttpException ? $error->status : 503;
  if (class_exists(ErrorResponder::class))
  {
    $response = (new ErrorResponder($releaseRoot))->respond($status, 'STAGING_UNAVAILABLE',
      'Halaman belum tersedia. Silakan coba lagi.', $requestId,
      str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json'))
      ->withHeader('X-Request-Id', $requestId);
    if (class_exists(StagingQueryRouting::class))
    {
      $response = StagingQueryRouting::response($response, $request ?? new Request('GET', '/'));
    }
    $response->send(($_SERVER['REQUEST_METHOD'] ?? '') === 'HEAD');
  }
  else
  {
    http_response_code($status);
    header('Content-Type: text/plain; charset=utf-8');
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'HEAD')
    {
      echo 'Staging belum tersedia. Silakan coba lagi.';
    }
  }
}
