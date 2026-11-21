<?php
declare(strict_types=1);

// PHP built-in server router. Production document root remains public/.
use RylvaGreen\Http\ErrorResponder;
use RylvaGreen\Http\HttpException;
use RylvaGreen\Http\Request;
use RylvaGreen\Http\Response;

$projectRoot = dirname(__DIR__, 2);
require_once $projectRoot . '/vendor/autoload.php';
$publicRoot = realpath($projectRoot . '/public');
$errors = new ErrorResponder($projectRoot);
$requestId = bin2hex(random_bytes(8));

try
{
  $request = Request::fromGlobals();
  if (preg_match('~(?:^|/)\.(?!well-known(?:/|$))~', $request->path))
  {
    $errors->respond(403, 'ACCESS_DENIED', 'Akses tidak diizinkan.', $requestId, $request->prefersJson())
      ->send($request->method === 'HEAD');
    return true;
  }
  $errorPaths = ['/pages/public/error-403.html', '/pages/public/error-404.html',
    '/pages/public/error-500.html', '/pages/public/maintenance.html'];
  $filePath = realpath($publicRoot . $request->path);
  if ($filePath !== false && is_file($filePath) && !in_array($request->path, $errorPaths, true)
    && $request->path !== '/index.php')
  {
    $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $allowed = ['html', 'css', 'js', 'json', 'svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'ico',
      'woff', 'woff2', 'ttf', 'txt', 'xml', 'webmanifest', 'mp4', 'webm'];
    if (!str_starts_with($filePath, $publicRoot . DIRECTORY_SEPARATOR) || !in_array($extension, $allowed, true))
    {
      $errors->respond(403, 'ACCESS_DENIED', 'Akses tidak diizinkan.', $requestId, $request->prefersJson())
        ->send($request->method === 'HEAD');
      return true;
    }
    if (!in_array($request->method, ['GET', 'HEAD'], true))
    {
      Response::json(['error' => ['code' => 'METHOD_NOT_ALLOWED', 'message' => 'Gunakan GET atau HEAD.']], 405)
        ->withHeader('Allow', 'GET, HEAD')->send();
      return true;
    }
    return false;
  }
  if ($request->path !== '/' && $filePath !== false && is_dir($filePath))
  {
    $errors->respond(403, 'ACCESS_DENIED', 'Daftar direktori tidak tersedia.', $requestId, $request->prefersJson())
      ->send($request->method === 'HEAD');
    return true;
  }
}
catch (HttpException $error)
{
  $errors->respond($error->status, $error->errorCode, $error->getMessage(), $requestId, true)
    ->send(($_SERVER['REQUEST_METHOD'] ?? '') === 'HEAD');
  return true;
}

require $publicRoot . '/index.php';
return true;
