<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Security;

use RylvaGreen\Config\AppConfig;

/**
 * Penentu alamat IP klien tunggal sesuai Bagian 15.2 & BR-32.
 * Mengabaikan header X-Forwarded-For kecuali REMOTE_ADDR berada di dalam TRUSTED_PROXIES.
 */
final class ClientIpResolver
{
    public static function resolve(): string
    {
        $remote = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $trustedProxies = AppConfig::trustedProxies();

        if (!in_array($remote, $trustedProxies, true)) {
            return $remote;
        }

        $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        $chain = array_map('trim', explode(',', $xff));
        foreach (array_reverse($chain) as $ip) {
            if (filter_var($ip, FILTER_VALIDATE_IP) && !in_array($ip, $trustedProxies, true)) {
                return $ip;
            }
        }
        return $remote;
    }
}
