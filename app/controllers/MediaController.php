<?php
class MediaController extends Controller
{
    // ── TV Channels ──
    public function tvChannels(): void
    {
        $channels = Database::fetchAll("SELECT * FROM tv_channels WHERE is_active = 1 ORDER BY sort_order, name");
        Response::success($channels);
    }

    // ── Radio Stations ──
    public function radioStations(): void
    {
        $category = $_GET['category'] ?? '';
        $sql = "SELECT * FROM radio_stations WHERE is_active = 1";
        $params = [];
        if ($category) { $sql .= " AND category = ?"; $params[] = $category; }
        $sql .= " ORDER BY country, name";
        Response::success(Database::fetchAll($sql, $params));
    }

    public function radioStore(): void
    {
        $data = Request::body();
        if (empty($data['name']) || empty($data['url'])) {
            Response::error('Name and URL are required');
            return;
        }
        $id = Database::insert('radio_stations', [
            'name' => $data['name'],
            'url' => $data['url'],
            'country' => $data['country'] ?? 'Indonesia',
            'category' => $data['category'] ?? 'local',
        ]);
        Response::success(['id' => $id], 'Station added');
    }

    public function radioUpdate($id): void
    {
        $data = Request::body();
        $fields = [];
        foreach (['name','url','country','category','is_active'] as $f) {
            if (isset($data[$f])) $fields[$f] = $data[$f];
        }
        if (empty($fields)) { Response::error('Nothing to update'); return; }
        Database::update('radio_stations', $fields, 'id = ?', [$id]);
        Response::success(null, 'Station updated');
    }

    public function radioDestroy($id): void
    {
        Database::delete('radio_stations', 'id = ?', [$id]);
        Response::success(null, 'Station deleted');
    }
}
