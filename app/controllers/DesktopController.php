<?php
class DesktopController extends Controller
{
    public function index(): void
    {
        $this->desktop();
    }
    
    public function config(): void
    {
        $config = require CONFIG_PATH . '/app.php';
        $prefs = Database::fetchAll("SELECT `key`, value FROM preferences");
        
        $preferences = [];
        foreach ($prefs as $p) {
            $preferences[$p['key']] = $p['value'];
        }
        
        $this->json([
            'modules'     => $config['modules'],
            'categories'  => $config['categories'] ?? [],
            'preferences' => $preferences,
        ]);
    }
    
    public function savePreferences(): void
    {
        $data = Request::body();
        
        foreach ($data as $key => $value) {
            Database::query(
                "INSERT INTO preferences (`key`, value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()",
                [$key, $value]
            );
        }
        
        Response::success(null, 'Preferences saved');
    }
}
