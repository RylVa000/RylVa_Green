<?php
declare(strict_types=1);

use RylvaGreen\Config\AppConfig;
use RylvaGreen\Http\Controllers\System\HealthController;
use RylvaGreen\Http\HttpException;
use RylvaGreen\Http\Request;
use RylvaGreen\Http\Response;
use RylvaGreen\Infrastructure\Database\DatabaseConnection;

$routes = [];
$redirects = ['/' => '/pages/public/home.html', '/index.php' => '/pages/public/home.html'];
$legacyPaths = json_decode(file_get_contents(__DIR__ . '/preview-pages.json'), true, 512, JSON_THROW_ON_ERROR);
foreach ($legacyPaths as $alias => $destination)
{
  $redirects['/' . $alias] = '/' . $destination;
}
foreach ($redirects as $path => $destination)
{
  $routes[] = [
    'method' => 'GET',
    'path' => $path,
    'handler' => static function (Request $request) use ($destination): Response
    {
      $query = http_build_query($request->query, '', '&', PHP_QUERY_RFC3986);
      return Response::redirect($destination . ($query !== '' ? '?' . $query : ''));
    },
  ];
}
foreach ([403 => 'error-403.html', 404 => 'error-404.html', 500 => 'error-500.html', 503 => 'maintenance.html'] as $status => $page)
{
  $routes[] = [
    'method' => 'GET',
    'path' => '/pages/public/' . $page,
    'handler' => static fn (Request $request): Response => throw new HttpException($status, 'HTTP_' . $status, 'Halaman tidak tersedia.'),
  ];
}
if (in_array(AppConfig::get('APP_ENV'), ['development', 'testing'], true))
{
  $routes[] = [
    'method' => 'GET',
    'path' => '/health',
    'handler' => new HealthController(static fn (): PDO => DatabaseConnection::get()),
  ];
}
return $routes;
