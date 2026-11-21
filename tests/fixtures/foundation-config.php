<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/vendor/autoload.php';

try
{
  RylvaGreen\Config\AppConfig::boot($argv[1]);
  echo json_encode([
    'ok' => true,
    'environment' => RylvaGreen\Config\AppConfig::get('APP_ENV'),
    'port' => RylvaGreen\Config\AppConfig::get('DB_PORT'),
    'debug' => RylvaGreen\Config\AppConfig::boolean('APP_DEBUG'),
    'label' => RylvaGreen\Config\AppConfig::get('TEST_LABEL'),
  ], JSON_THROW_ON_ERROR);
}
catch (Throwable $error)
{
  echo json_encode(['ok' => false, 'message' => $error->getMessage()], JSON_THROW_ON_ERROR);
}
