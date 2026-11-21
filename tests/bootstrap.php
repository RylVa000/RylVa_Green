<?php
declare(strict_types=1);

use RylvaGreen\Config\AppConfig;

require_once dirname(__DIR__) . '/vendor/autoload.php';
AppConfig::boot(getenv('RYLVA_TEST_ENV_FILE') ?: dirname(__DIR__) . '/config/.env.testing');
if (AppConfig::get('APP_ENV') !== 'testing')
{
  throw new RuntimeException('Tests require APP_ENV=testing.');
}
date_default_timezone_set('UTC');
