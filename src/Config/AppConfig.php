<?php
declare(strict_types=1);

namespace RylvaGreen\Config;

use RuntimeException;

final class AppConfig
{
  private static array $fileValues = [];
  private static bool $booted = false;

  public static function boot(string $envFilePath): void
  {
    if (self::$booted)
    {
      return;
    }
    self::$fileValues = [];
    if (is_file($envFilePath))
    {
      if (!is_readable($envFilePath))
      {
        throw new RuntimeException('The application environment file is not readable.');
      }
      foreach (file($envFilePath, FILE_IGNORE_NEW_LINES) ?: [] as $index => $line)
      {
        if ($index === 0 && str_starts_with($line, "\xEF\xBB\xBF"))
        {
          $line = substr($line, 3);
        }
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#'))
        {
          continue;
        }
        if (!preg_match('/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/', $line, $matches))
        {
          throw new RuntimeException('Invalid environment assignment on line ' . ($index + 1) . '.');
        }
        $value = trim($matches[2]);
        if (str_starts_with($value, '"') || str_starts_with($value, "'"))
        {
          if (strlen($value) < 2 || !str_ends_with($value, $value[0]))
          {
            throw new RuntimeException('Unclosed environment value on line ' . ($index + 1) . '.');
          }
          $value = substr($value, 1, -1);
        }
        else
        {
          $value = rtrim(preg_replace('/\s+#.*$/', '', $value) ?? $value);
        }
        self::$fileValues[$matches[1]] = $value;
      }
    }
    self::validate();
    self::$booted = true;
  }

  public static function get(string $key, ?string $default = null): ?string
  {
    $value = getenv($key);
    return $value !== false ? $value : (self::$fileValues[$key] ?? $default);
  }

  public static function boolean(string $key, bool $default = false): bool
  {
    $value = self::get($key);
    if ($value === null)
    {
      return $default;
    }
    $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($parsed === null)
    {
      throw new RuntimeException('Invalid boolean environment variable: ' . $key . '.');
    }
    return $parsed;
  }

  public static function trustedProxies(): array
  {
    return array_values(array_filter(array_map('trim', explode(',', self::get('TRUSTED_PROXIES', '') ?? ''))));
  }

  private static function validate(): void
  {
    foreach (['APP_ENV', 'APP_BASE_URL', 'DB_HOST', 'DB_NAME', 'DB_USER'] as $key)
    {
      if (trim(self::get($key, '') ?? '') === '')
      {
        throw new RuntimeException('Missing required environment variable: ' . $key . '.');
      }
    }
    if (!in_array(self::get('APP_ENV'), ['development', 'testing', 'staging', 'production'], true))
    {
      throw new RuntimeException('Invalid APP_ENV.');
    }
    $url = parse_url(self::get('APP_BASE_URL', '') ?? '');
    if (!is_array($url) || !isset($url['host']) || !in_array($url['scheme'] ?? '', ['http', 'https'], true)
      || isset($url['user']) || isset($url['pass']) || isset($url['query']) || isset($url['fragment']))
    {
      throw new RuntimeException('APP_BASE_URL must be an HTTP(S) base URL without credentials or a query.');
    }
    $port = self::get('DB_PORT', '3306') ?? '';
    if (!ctype_digit($port) || (int) $port < 1 || (int) $port > 65535)
    {
      throw new RuntimeException('DB_PORT must be a valid TCP port.');
    }
    if (!preg_match('/^[A-Za-z0-9_]{1,64}$/', self::get('DB_NAME', '') ?? ''))
    {
      throw new RuntimeException('Invalid DB_NAME.');
    }
    $host = self::get('DB_HOST', '') ?? '';
    if (!filter_var($host, FILTER_VALIDATE_IP) && !preg_match('/^[A-Za-z0-9.-]+$/', $host))
    {
      throw new RuntimeException('Invalid DB_HOST.');
    }
    $debug = self::boolean('APP_DEBUG');
    if (self::get('APP_ENV') === 'production' && $debug)
    {
      throw new RuntimeException('APP_DEBUG must be disabled in production.');
    }
    if (self::get('APP_TIMEZONE', 'UTC') !== 'UTC')
    {
      throw new RuntimeException('The application storage timezone must be UTC.');
    }
  }
}
