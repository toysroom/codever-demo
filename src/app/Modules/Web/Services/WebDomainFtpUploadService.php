<?php

namespace App\Modules\Web\Services;

use App\Models\WebDomain;
use App\Models\WebDomainFtpAccount;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use phpseclib3\Net\SFTP;
use Throwable;

class WebDomainFtpUploadService
{
    /** Path inside WordPress root (plugin cartella futura zelante-connector). */
    public const CONNECTOR_RELATIVE_FILE = 'wp-content/plugins/zelante-connector/.zelante-connection-test.txt';

    public const CONNECTOR_PLUGIN_FILE = 'wp-content/plugins/zelante-connector/zelante-connector.php';

    public const CONNECTOR_SECRET_FILE = 'wp-content/plugins/zelante-connector/zelante-secret.php';

    /**
     * @return array{ok: true, remote_path: string, message: string}
     */
    public function uploadConnectorTestFile(WebDomain $domain, WebDomainFtpAccount $account): array
    {
        $account->loadMissing('webDomain');
        if ((int) $account->web_domain_id !== (int) $domain->id) {
            throw new \InvalidArgumentException(__('L’account FTP non appartiene a questo dominio.'));
        }

        $payload = [
            'kind' => 'zelante_connector_upload_test',
            'generated_at' => now()->toIso8601String(),
            'web_domain_id' => $domain->id,
            'hostname' => $domain->hostname,
            'token' => (string) Str::uuid(),
        ];
        $body = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \RuntimeException(__('Impossibile preparare il file di test.'));
        }

        $protocol = strtolower(trim($account->protocol));

        try {
            if ($protocol === 'sftp') {
                $this->putSftpRelative($account, self::CONNECTOR_RELATIVE_FILE, $body);
            } elseif ($protocol === 'ftp' || $protocol === 'ftps') {
                $this->putFtpRelative($account, self::CONNECTOR_RELATIVE_FILE, $body, $protocol === 'ftps');
            } else {
                throw new \InvalidArgumentException(__('Protocollo FTP non supportato.'));
            }
        } catch (Throwable $e) {
            throw new \RuntimeException($e->getMessage(), (int) $e->getCode(), $e);
        }

        return [
            'ok' => true,
            'remote_path' => self::CONNECTOR_RELATIVE_FILE,
            'message' => __('File di test caricato correttamente.'),
        ];
    }

    /**
     * Carica un .txt in `wp-content/`, ne verifica lettura confrontando il contenuto, poi elimina il file (round-trip).
     *
     * Usa sempre le credenziali salvate a DB ({@see WebDomainFtpAccount}); salva le modifiche al form prima del test.
     *
     * @return array{ok: true, remote_path: string, message: string, preview?: string|null, preview_truncated?: bool}
     */
    public function roundtripTxtTest(WebDomain $domain, WebDomainFtpAccount $account): array
    {
        $account->loadMissing('webDomain');
        if ((int) $account->web_domain_id !== (int) $domain->id) {
            throw new \InvalidArgumentException(__('L’account FTP non appartiene a questo dominio.'));
        }

        $token = (string) Str::uuid();
        $basename = 'zelante-roundtrip-'.$token.'.txt';
        $relativePath = 'wp-content/'.$basename;
        $generatedAt = now()->toIso8601String();
        $payload =
            'zelante_roundtrip_kind=ftp_txt_roundtrip'."\n"
            .'zelante_roundtrip_verification='.$token."\n"
            .'zelante_generated_at='.$generatedAt."\n";
        $preview = mb_strlen($payload) > 220 ? mb_substr($payload, 0, 220) : $payload;
        $previewTruncated = mb_strlen($payload) > 220;

        $protocol = strtolower(trim($account->protocol));

        try {
            if ($protocol === 'sftp') {
                $this->roundtripViaSftp($account, $relativePath, $payload);
            } elseif ($protocol === 'ftp' || $protocol === 'ftps') {
                $this->roundtripViaFtp($account, $basename, $payload, $protocol === 'ftps');
            } else {
                throw new \InvalidArgumentException(__('Protocollo FTP non supportato.'));
            }
        } catch (Throwable $e) {
            throw new \RuntimeException($e->getMessage(), (int) $e->getCode(), $e);
        }

        return [
            'ok' => true,
            'remote_path' => $relativePath,
            'message' => __('Test round-trip completato: upload, lettura e cancellazione eseguiti correttamente.'),
            'preview' => $preview !== '' ? $preview : null,
            'preview_truncated' => $previewTruncated,
        ];
    }

    public function resolveDefaultFtpAccount(WebDomain $domain): ?WebDomainFtpAccount
    {
        return WebDomainFtpAccount::query()
            ->where('web_domain_id', $domain->id)
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->first();
    }

    /**
     * Carica plugin WordPress + file secret con il token (API REST protetta).
     *
     * @return array{plugin_path: string, secret_path: string}
     */
    public function deployWordPressConnector(WebDomain $domain, WebDomainFtpAccount $account, string $connectorTokenPlain): array
    {
        $account->loadMissing('webDomain');
        if ((int) $account->web_domain_id !== (int) $domain->id) {
            throw new \InvalidArgumentException(__('L’account FTP non appartiene a questo dominio.'));
        }

        if ($connectorTokenPlain === '') {
            throw new \InvalidArgumentException(__('Token connettore mancante.'));
        }

        $pluginPath = resource_path('wordpress/zelante-connector/zelante-connector.php');
        if (! File::isFile($pluginPath)) {
            throw new \RuntimeException(__('File plugin Zelante non trovato in resources.'));
        }

        $pluginBody = File::get($pluginPath);
        if (! is_string($pluginBody) || $pluginBody === '') {
            throw new \RuntimeException(__('Impossibile leggere il plugin Zelante da resources.'));
        }

        $escaped = addcslashes($connectorTokenPlain, "'\\");
        $secretBody = "<?php\n\ndeclare(strict_types=1);\n\nreturn '".$escaped."';\n";

        $protocol = strtolower(trim($account->protocol));

        try {
            if ($protocol === 'sftp') {
                $this->putSftpRelative($account, self::CONNECTOR_SECRET_FILE, $secretBody);
                $this->putSftpRelative($account, self::CONNECTOR_PLUGIN_FILE, $pluginBody);
            } elseif ($protocol === 'ftp' || $protocol === 'ftps') {
                $this->putFtpRelative($account, self::CONNECTOR_SECRET_FILE, $secretBody, $protocol === 'ftps');
                $this->putFtpRelative($account, self::CONNECTOR_PLUGIN_FILE, $pluginBody, $protocol === 'ftps');
            } else {
                throw new \InvalidArgumentException(__('Protocollo FTP non supportato.'));
            }
        } catch (Throwable $e) {
            throw new \RuntimeException($e->getMessage(), (int) $e->getCode(), $e);
        }

        return [
            'plugin_path' => self::CONNECTOR_PLUGIN_FILE,
            'secret_path' => self::CONNECTOR_SECRET_FILE,
        ];
    }

    private function putSftpRelative(WebDomainFtpAccount $account, string $relativePath, string $contents): void
    {
        $relativePath = trim(str_replace('\\', '/', $relativePath), '/');
        $port = $account->port ?? 22;
        $sftp = new SFTP($account->host, $port, 30);
        if (! $sftp->login($account->username, $account->password)) {
            throw new \RuntimeException(__('Accesso SFTP non riuscito (credenziali o host).'));
        }

        $base = trim(str_replace('\\', '/', (string) $account->remote_base_path), '/');
        if ($base !== '') {
            if (! $sftp->chdir($base)) {
                throw new \RuntimeException(
                    __('Impossibile entrare nella cartella remota `:path`. Verifica il percorso root di WordPress.', ['path' => $base])
                );
            }
        }

        $dir = dirname($relativePath);
        if ($dir !== '.' && $dir !== '') {
            if (! $sftp->is_dir($dir)) {
                if (! $sftp->mkdir($dir, 0775, true)) {
                    throw new \RuntimeException(
                        __('Impossibile creare la cartella `:path` sul server.', ['path' => $dir])
                    );
                }
            }
        }

        if (! $sftp->put($relativePath, $contents)) {
            throw new \RuntimeException(__('Scrittura del file via SFTP non riuscita.'));
        }
    }

    private function putFtpRelative(WebDomainFtpAccount $account, string $relativePath, string $contents, bool $ssl): void
    {
        if (! function_exists('ftp_connect')) {
            throw new \RuntimeException(
                __('Il server dell’applicazione non ha l’estensione PHP `ftp`: usa SFTP oppure abilita `ext-ftp`.')
            );
        }

        $relativePath = trim(str_replace('\\', '/', $relativePath), '/');
        $host = $account->host;
        $port = $account->port ?? 21;
        $timeout = 30;

        $conn = $ssl
            ? @ftp_ssl_connect($host, $port, $timeout)
            : @ftp_connect($host, $port, $timeout);

        if ($conn === false) {
            throw new \RuntimeException(__('Connessione FTP non riuscita (host/porta).'));
        }

        try {
            if (! @ftp_login($conn, $account->username, $account->password)) {
                throw new \RuntimeException(__('Login FTP non riuscito.'));
            }

            @ftp_pasv($conn, true);

            $base = trim(str_replace('\\', '/', (string) $account->remote_base_path), '/');
            if ($base !== '') {
                if (! @ftp_chdir($conn, '/'.$base) && ! @ftp_chdir($conn, $base)) {
                    throw new \RuntimeException(
                        __('Impossibile entrare nella cartella remota `:path`. Verifica il percorso root di WordPress.', ['path' => $base])
                    );
                }
            }

            $segments = explode('/', $relativePath);
            $filename = array_pop($segments);
            foreach ($segments as $segment) {
                if ($segment === '') {
                    continue;
                }
                @ftp_mkdir($conn, $segment);
                if (! @ftp_chdir($conn, $segment)) {
                    throw new \RuntimeException(
                        __('Impossibile creare o accedere alla cartella `:folder`.', ['folder' => $segment])
                    );
                }
            }

            $tmp = tempnam(sys_get_temp_dir(), 'zelftp');
            if ($tmp === false) {
                throw new \RuntimeException(__('Impossibile creare un file temporaneo locale.'));
            }

            try {
                file_put_contents($tmp, $contents);
                if (! ftp_put($conn, $filename, $tmp, FTP_BINARY)) {
                    throw new \RuntimeException(__('Upload FTP del file non riuscito.'));
                }
            } finally {
                @unlink($tmp);
            }
        } finally {
            ftp_close($conn);
        }
    }

    private function roundtripViaSftp(WebDomainFtpAccount $account, string $relativePath, string $expectedContents): void
    {
        $port = $account->port ?? 22;
        $sftp = new SFTP($account->host, $port, 30);
        if (! $sftp->login($account->username, $account->password)) {
            throw new \RuntimeException(__('Accesso SFTP non riuscito (credenziali o host).'));
        }

        $base = trim(str_replace('\\', '/', (string) $account->remote_base_path), '/');
        if ($base !== '') {
            if (! $sftp->chdir($base)) {
                throw new \RuntimeException(
                    __('Impossibile entrare nella cartella remota `:path`. Verifica il percorso root di WordPress.', ['path' => $base])
                );
            }
        }

        $wc = 'wp-content';
        if (! $sftp->is_dir($wc)) {
            if (! $sftp->mkdir($wc, 0775, true)) {
                throw new \RuntimeException(__('Impossibile creare `:dir` sul server.', ['dir' => $wc]));
            }
        }

        $hadFile = false;
        try {
            if (! $sftp->put($relativePath, $expectedContents)) {
                throw new \RuntimeException(__('Upload SFTP del file di test non riuscito.'));
            }
            $hadFile = true;

            $readBack = $sftp->get($relativePath);
            if ($readBack === false) {
                throw new \RuntimeException(__('Lettura del file caricato via SFTP non riuscita.'));
            }
            $expected = preg_replace('/\r\n|\r/', "\n", $expectedContents);
            $got = preg_replace('/\r\n|\r/', "\n", (string) $readBack);
            if ($got !== $expected) {
                throw new \RuntimeException(__('Il contenuto letto dopo l’upload non coincide con quanto inviato.'));
            }

            if (! $sftp->delete($relativePath)) {
                throw new \RuntimeException(__('Impossibile eliminare il file di test dopo la verifica (controllare i permessi).'));
            }
            $hadFile = false;
        } catch (\Throwable $e) {
            if ($hadFile) {
                @$sftp->delete($relativePath);
            }

            throw $e;
        }
    }

    private function roundtripViaFtp(WebDomainFtpAccount $account, string $basename, string $expectedContents, bool $ssl): void
    {
        if (! function_exists('ftp_connect')) {
            throw new \RuntimeException(
                __('Il server dell’applicazione non ha l’estensione PHP `ftp`: usa SFTP oppure abilita `ext-ftp`.')
            );
        }

        $host = $account->host;
        $port = $account->port ?? 21;
        $timeout = 30;

        $conn = $ssl
            ? @ftp_ssl_connect($host, $port, $timeout)
            : @ftp_connect($host, $port, $timeout);

        if ($conn === false) {
            throw new \RuntimeException(__('Connessione FTP non riuscita (host/porta).'));
        }

        $hadFile = false;
        try {
            if (! @ftp_login($conn, $account->username, $account->password)) {
                throw new \RuntimeException(__('Login FTP non riuscito.'));
            }

            @ftp_pasv($conn, true);

            $base = trim(str_replace('\\', '/', (string) $account->remote_base_path), '/');
            if ($base !== '') {
                if (! @ftp_chdir($conn, '/'.$base) && ! @ftp_chdir($conn, $base)) {
                    throw new \RuntimeException(
                        __('Impossibile entrare nella cartella remota `:path`. Verifica il percorso root di WordPress.', ['path' => $base])
                    );
                }
            }

            @ftp_mkdir($conn, 'wp-content');
            if (! @ftp_chdir($conn, 'wp-content')) {
                throw new \RuntimeException(__('Impossibile accedere a `wp-content` sul server remoto.'));
            }

            $tmpUp = tempnam(sys_get_temp_dir(), 'zftrup');
            if ($tmpUp === false) {
                throw new \RuntimeException(__('Impossibile creare un file temporaneo locale.'));
            }

            try {
                file_put_contents($tmpUp, $expectedContents);
                if (! ftp_put($conn, $basename, $tmpUp, FTP_BINARY)) {
                    throw new \RuntimeException(__('Upload FTP del file di test non riuscito.'));
                }
            } finally {
                @unlink($tmpUp);
            }
            $hadFile = true;

            $tmpDown = tempnam(sys_get_temp_dir(), 'zftrdn');
            if ($tmpDown === false) {
                throw new \RuntimeException(__('Impossibile creare un file temporaneo locale.'));
            }

            try {
                if (! ftp_get($conn, $tmpDown, $basename, FTP_BINARY)) {
                    throw new \RuntimeException(__('Download FTP del file di test non riuscito.'));
                }
                $got = (string) file_get_contents($tmpDown);
                $expected = preg_replace('/\r\n|\r/', "\n", $expectedContents);
                $normalized = preg_replace('/\r\n|\r/', "\n", $got);
                if ($normalized !== $expected) {
                    throw new \RuntimeException(__('Il contenuto letto dopo l’upload non coincide con quanto inviato.'));
                }
            } finally {
                @unlink($tmpDown);
            }

            if (! @ftp_delete($conn, $basename)) {
                throw new \RuntimeException(__('Impossibile eliminare il file di test dopo la verifica (controllare i permessi).'));
            }
            $hadFile = false;
        } catch (\Throwable $e) {
            if ($hadFile) {
                @ftp_delete($conn, $basename);
            }

            throw $e;
        } finally {
            ftp_close($conn);
        }
    }
}
