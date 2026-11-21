<?php
declare(strict_types=1);

// This creates only an ephemeral runner configuration, never a local user's .env file.
if (getenv('GITHUB_ACTIONS') !== 'true')
{
  fwrite(STDERR, 'This command is restricted to an ephemeral GitHub Actions runner.' . PHP_EOL);
  exit(1);
}
$projectRoot = dirname(__DIR__, 2);
$directory = $projectRoot . '/storage/cache/ci';
$environmentFile = $directory . '/.env.testing';
if (is_file($environmentFile))
{
  fwrite(STDERR, 'The runner environment already exists; nothing was overwritten.' . PHP_EOL);
  exit(1);
}
$values = [
  'APP_ENV' => 'testing', 'APP_DEBUG' => 'false', 'APP_TIMEZONE' => 'UTC',
  'APP_BASE_URL' => 'http://127.0.0.1:4186', 'DB_HOST' => '127.0.0.1',
  'DB_PORT' => getenv('DB_PORT') ?: '13367', 'DB_NAME' => getenv('DB_NAME') ?: '',
  'DB_USER' => getenv('DB_USER') ?: '', 'DB_PASSWORD' => getenv('DB_PASSWORD') ?: '',
  'MYSQL_CLIENT_BIN' => 'mysql',
];
if (!preg_match('/^rylva_green_[a-z0-9_]+_test$/', $values['DB_NAME']) || $values['DB_USER'] === '')
{
  fwrite(STDERR, 'An explicit isolated test database and user are required.' . PHP_EOL);
  exit(1);
}
$lines = [];
foreach ($values as $key => $value)
{
  if (strpbrk($value, "\r\n\"'") !== false)
  {
    throw new RuntimeException('Invalid runner configuration field: ' . $key . '.');
  }
  $lines[] = $key . '="' . $value . '"';
}
if (!is_dir($directory))
{
  mkdir($directory, 0700, true);
}
file_put_contents($environmentFile, implode("\n", $lines) . "\n");
chmod($environmentFile, 0600);
echo 'Private runner environment created.' . PHP_EOL;
