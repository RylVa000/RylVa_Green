<?php
declare(strict_types=1);

use RylvaGreen\Config\AppConfig;
use RylvaGreen\Http\ErrorResponder;
use RylvaGreen\Http\Kernel;

$projectRoot = dirname(__DIR__);
require_once $projectRoot . '/vendor/autoload.php';
AppConfig::boot(getenv('RYLVA_ENV_FILE') ?: $projectRoot . '/config/.env');
date_default_timezone_set('UTC');
ini_set('display_errors', '0');
error_reporting(E_ALL);
return new Kernel(require $projectRoot . '/config/routes.php', new ErrorResponder($projectRoot));
