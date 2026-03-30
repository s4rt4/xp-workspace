<?php
class ApiKeyController extends Controller
{
    /** List keys for an app (hides full key, shows masked version) */
    public function index(): void
    {
        $app = $_GET['app'] ?? '';
        if (empty($app)) {
            Response::error('App parameter required');
            return;
        }

        $keys = Database::fetchAll(
            "SELECT id, app, provider, CONCAT(LEFT(api_key, 8), '...', RIGHT(api_key, 4)) as api_key_masked, is_active, extra, updated_at FROM api_keys WHERE app = ? ORDER BY provider",
            [$app]
        );
        Response::success($keys);
    }

    /** Get raw key for internal use (used by proxy controllers) */
    public static function getKey(string $app, string $provider): ?string
    {
        $row = Database::fetch(
            "SELECT api_key FROM api_keys WHERE app = ? AND provider = ? AND is_active = 1",
            [$app, $provider]
        );
        return $row['api_key'] ?? null;
    }

    /** Get extra JSON data for a key */
    public static function getExtra(string $app, string $provider): ?array
    {
        $row = Database::fetch(
            "SELECT extra FROM api_keys WHERE app = ? AND provider = ? AND is_active = 1",
            [$app, $provider]
        );
        if (!$row || !$row['extra']) return null;
        return json_decode($row['extra'], true);
    }

    /** Save/update a key */
    public function save(): void
    {
        $data = Request::body();
        $app = $data['app'] ?? '';
        $provider = $data['provider'] ?? '';
        $key = $data['api_key'] ?? '';

        if (empty($app) || empty($provider) || empty($key)) {
            Response::error('App, provider, and api_key are required');
            return;
        }

        $extra = isset($data['extra']) ? json_encode($data['extra']) : null;

        Database::query(
            "INSERT INTO api_keys (app, provider, api_key, extra) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE api_key = VALUES(api_key), extra = VALUES(extra), updated_at = NOW()",
            [$app, $provider, $key, $extra]
        );

        Response::success(null, 'API key saved');
    }

    /** Toggle active state */
    public function toggle($id): void
    {
        Database::query("UPDATE api_keys SET is_active = NOT is_active WHERE id = ?", [$id]);
        $row = Database::fetch("SELECT id, provider, is_active FROM api_keys WHERE id = ?", [$id]);
        Response::success($row, 'Toggled');
    }

    /** Delete a key */
    public function destroy($id): void
    {
        Database::delete('api_keys', 'id = ?', [$id]);
        Response::success(null, 'API key deleted');
    }
}
