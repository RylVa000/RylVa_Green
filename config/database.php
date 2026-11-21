<?php
declare(strict_types=1);

use RylvaGreen\Config\AppConfig;

return [
  'host' => AppConfig::get('DB_HOST', '127.0.0.1'),
  'port' => (int) AppConfig::get('DB_PORT', '3306'),
  'database' => AppConfig::get('DB_NAME'),
  'username' => AppConfig::get('DB_USER'),
  'password' => AppConfig::get('DB_PASSWORD', ''),
];
