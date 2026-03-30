<?php
class HashController extends Controller
{
    public function generate(): void
    {
        $data = Request::body();
        $password = $data['password'] ?? '';
        $algorithm = $data['algorithm'] ?? 'bcrypt';

        if (empty($password)) {
            Response::error('Password is required');
            return;
        }

        switch ($algorithm) {
            case 'bcrypt':
                $hash = password_hash($password, PASSWORD_DEFAULT);
                break;
            case 'sha256':
                $hash = hash('sha256', $password);
                break;
            case 'md5':
                $hash = hash('md5', $password);
                break;
            default:
                Response::error('Invalid algorithm');
                return;
        }

        Response::success([
            'hash' => $hash,
            'algorithm' => $algorithm,
        ], 'Hash generated');
    }

    public function verify(): void
    {
        $data = Request::body();
        $password = $data['password'] ?? '';
        $hash = $data['hash'] ?? '';

        if (empty($password) || empty($hash)) {
            Response::error('Password and hash are required');
            return;
        }

        $match = false;
        $format = 'unknown';

        // Detect format and verify
        if (strlen($hash) === 60 && str_starts_with($hash, '$2')) {
            // Bcrypt
            $match = password_verify($password, $hash);
            $format = 'Bcrypt';
        } elseif (strlen($hash) === 64 && ctype_xdigit($hash)) {
            // SHA-256
            $match = hash('sha256', $password) === $hash;
            $format = 'SHA-256';
        } elseif (strlen($hash) === 32 && ctype_xdigit($hash)) {
            // MD5
            $match = hash('md5', $password) === $hash;
            $format = 'MD5';
        } else {
            // Try bcrypt anyway
            $match = password_verify($password, $hash);
            $format = $match ? 'Bcrypt' : 'Unknown';
        }

        Response::success([
            'match' => $match,
            'format' => $format,
        ]);
    }
}
