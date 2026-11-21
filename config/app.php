<?php
declare(strict_types=1);

use RylvaGreen\Config\AppConfig;

return [
  'environment' => AppConfig::get('APP_ENV', 'production'),
  'debug' => AppConfig::boolean('APP_DEBUG'),
  'baseUrl' => AppConfig::get('APP_BASE_URL'),
  'timezone' => 'UTC',
];
