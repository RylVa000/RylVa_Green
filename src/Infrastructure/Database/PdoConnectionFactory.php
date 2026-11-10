<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Database;

use PDO;
use RylvaGreen\Config\AppConfig;

/**
 * Pembuat koneksi PDO MySQL/InnoDB sesuai standar Bagian 15.4 & Lampiran A.1.
 */
final class PdoConnectionFactory
{
    public static function create(): PDO
    {
        $host = AppConfig::get('DB_HOST', '127.0.0.1');
        $port = AppConfig::get('DB_PORT', '3306');
        $name = AppConfig::get('DB_NAME', 'basis_data_penjualan_florist_dan_berkebun_rylva_green');
        $user = AppConfig::get('DB_USER', 'root');
        $pass = AppConfig::get('DB_PASSWORD', '') ?? '';

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
        return new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
}
