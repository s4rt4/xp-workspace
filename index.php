<?php
/**
 * XP Workspace - Project Management & Knowledge Base
 * Windows XP Themed Productivity Suite
 * 
 * Entry point / Front Controller
 */

define('ROOT_PATH', __DIR__);
define('APP_PATH', ROOT_PATH . '/app');
define('CORE_PATH', ROOT_PATH . '/core');
define('CONFIG_PATH', ROOT_PATH . '/config');
define('STORAGE_PATH', ROOT_PATH . '/storage');
define('PUBLIC_PATH', ROOT_PATH . '/public');
define('DB_PATH', ROOT_PATH . '/database');

// Auto-detect base URL (handles subdirectory like /xp-workspace/)
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
define('BASE_URL', ($scriptDir === '/' || $scriptDir === '.') ? '' : rtrim($scriptDir, '/'));

// Autoloader
spl_autoload_register(function ($class) {
    $dirs = [CORE_PATH, APP_PATH . '/controllers', APP_PATH . '/models'];
    foreach ($dirs as $dir) {
        $file = $dir . '/' . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Load config
$config = require CONFIG_PATH . '/app.php';

// Boot database
Database::boot(require CONFIG_PATH . '/database.php');

// Initialize and run router
$router = new Router();
require CONFIG_PATH . '/routes.php';
$router->dispatch();
