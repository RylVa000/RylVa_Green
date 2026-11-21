<?php
declare(strict_types=1);

namespace RylvaGreen\Infrastructure\Database;

final class SchemaChecksum
{
  public static function matches(string $source, array $manifest): bool
  {
    if (hash_equals($manifest['checksum'], hash('sha256', $source)))
    {
      return true;
    }
    $canonical = $manifest['canonicalChecksum'] ?? null;
    return is_string($canonical)
      && hash_equals($canonical, hash('sha256', str_replace("\r\n", "\n", $source)));
  }
}
