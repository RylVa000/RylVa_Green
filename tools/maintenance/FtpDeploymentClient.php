<?php
declare(strict_types=1);

/** Deployment tool only. Credentials are supplied from the ignored local configuration. */
final class FtpDeploymentClient
{
  private CurlHandle $connection;

  public function __construct(private readonly array $configuration)
  {
    if (($configuration['ftp']['protocol'] ?? '') !== 'ftp' || ($configuration['ftp']['port'] ?? 0) !== 21)
    {
      throw new RuntimeException('This deployment transport requires the explicitly selected FTP port 21 configuration.');
    }
    $this->connection = curl_init();
  }

  public function listDirectory(string $path): string
  {
    return $this->request($path, true, [CURLOPT_CUSTOMREQUEST => 'LIST -a']);
  }

  public function readFile(string $path): string
  {
    return $this->request($path, false, []);
  }

  public function uploadFile(string $localPath, string $remotePath): void
  {
    $stream = fopen($localPath, 'rb');
    if ($stream === false)
    {
      throw new RuntimeException('The local deployment file could not be opened.');
    }
    try
    {
      $this->request($remotePath, false, [
        CURLOPT_UPLOAD => true, CURLOPT_INFILE => $stream,
        CURLOPT_INFILESIZE => filesize($localPath), CURLOPT_FTP_CREATE_MISSING_DIRS => CURLFTP_CREATE_DIR_RETRY,
      ]);
    }
    finally
    {
      fclose($stream);
    }
  }

  public function uploadContent(string $content, string $remotePath): void
  {
    $stream = fopen('php://temp', 'w+b');
    fwrite($stream, $content);
    rewind($stream);
    try
    {
      $this->request($remotePath, false, [
        CURLOPT_UPLOAD => true, CURLOPT_INFILE => $stream,
        CURLOPT_INFILESIZE => strlen($content), CURLOPT_FTP_CREATE_MISSING_DIRS => CURLFTP_CREATE_DIR_RETRY,
      ]);
    }
    finally
    {
      fclose($stream);
    }
  }

  public function renameFile(string $fromPath, string $toPath): void
  {
    self::assertPath($fromPath);
    self::assertPath($toPath);
    $this->request('/', true, [CURLOPT_NOBODY => true, CURLOPT_QUOTE => [
      'RNFR ' . $fromPath, 'RNTO ' . $toPath,
    ]]);
  }

  public function removeFile(string $path): void
  {
    self::assertPath($path);
    $this->request('/', true, [CURLOPT_NOBODY => true, CURLOPT_QUOTE => ['DELE ' . $path]]);
  }

  private function request(string $path, bool $directory, array $options): string
  {
    self::assertPath($path);
    $ftp = $this->configuration['ftp'];
    $encoded = implode('/', array_map('rawurlencode', explode('/', ltrim($path, '/'))));
    $url = 'ftp://' . $ftp['host'] . ':' . $ftp['port'] . '/%2F' . $encoded;
    if ($directory)
    {
      $url = rtrim($url, '/') . '/';
    }
    curl_reset($this->connection);
    curl_setopt_array($this->connection, $options + [
      CURLOPT_URL => $url, CURLOPT_USERNAME => $ftp['username'], CURLOPT_PASSWORD => $ftp['password'],
      CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 15, CURLOPT_TIMEOUT => 120,
      CURLOPT_FTP_SKIP_PASV_IP => true,
    ]);
    $result = curl_exec($this->connection);
    if ($result === false)
    {
      $errorNumber = curl_errno($this->connection);
      $message = str_replace([$ftp['password'], $ftp['username']], '[redacted]', curl_error($this->connection));
      throw new RuntimeException('FTP request failed for ' . $path . ': ' . $message, $errorNumber);
    }
    return $result;
  }

  private static function assertPath(string $path): void
  {
    if (!str_starts_with($path, '/') || preg_match('~[\r\n\\\\]|(?:^|/)\.\.(?:/|$)~', $path))
    {
      throw new InvalidArgumentException('FTP deployment paths must be absolute and cannot contain traversal or control characters.');
    }
  }
}
