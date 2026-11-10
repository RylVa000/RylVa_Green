<?php
declare(strict_types=1);

namespace RylvaGreen\Config;

use RuntimeException;

/**
 * Kelas pemuat variabel lingkungan tunggal (Bagian 15.7 & BR-34).
 * Menghentikan aplikasi saat startup apabila variabel wajib kosong.
 */
final class AppConfig
{
    private static array $env = [];
    private static bool $booted = false;

    public static function boot(string $envFilePath): void
    {
        if (self::$booted) {
            return;
        }
        if (is_file($envFilePath) && is_readable($envFilePath)) {
            $lines = file($envFilePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            foreach ($lines as $line) {
                $trimmed = trim($line);
                if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
                    continue;
                }
                [$key, $val] = explode('=', $trimmed, 2);
                self::$env[trim($key)] = trim($val, " \t\n\r\0\x0B\"'");
            }
        }
        self::validateMandatoryVariables();
        self::$booted = true;
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $serverVal = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
        if (is_string($serverVal) && $serverVal !== '') {
            return $serverVal;
        }
        return self::$env[$key] ?? $default;
    }

    public static function trustedProxies(): array
    {
        $raw = self::get('TRUSTED_PROXIES', '') ?? '';
        return array_values(array_filter(array_map('trim', explode(',', $raw))));
    }

    private static function validateMandatoryVariables(): void
    {
        $mandatory = ['APP_ENV', 'APP_BASE_URL', 'DB_HOST', 'DB_NAME', 'DB_USER'];
        foreach ($mandatory as $key) {
            if ((self::get($key, '') ?? '') === '') {
                throw new RuntimeException("PELANGGARAN_BR34: Variabel lingkungan wajib '{$key}' belum disetel.");
            }
        }
        if (self::get('APP_ENV') === 'production' && self::get('APP_DEBUG') === 'true') {
            throw new RuntimeException('PELANGGARAN_KEAMANAN: APP_DEBUG dilarang bernilai true di produksi.');
        }
    }
}
