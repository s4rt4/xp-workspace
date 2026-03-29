<?php
/**
 * Database - PDO wrapper with SQLite/MySQL support
 * Singleton pattern for single connection
 */
class Database
{
    private static ?PDO $pdo = null;
    private static array $config = [];
    
    public static function boot(array $config): void
    {
        self::$config = $config;
    }
    
    public static function connection(): PDO
    {
        if (self::$pdo === null) {
            self::connect();
        }
        return self::$pdo;
    }
    
    private static function connect(): void
    {
        $config = self::$config;
        
        try {
            if ($config['driver'] === 'sqlite') {
                $dbFile = $config['database'];
                $isNew = !file_exists($dbFile);
                
                // Ensure directory exists
                $dbDir = dirname($dbFile);
                if (!is_dir($dbDir)) {
                    mkdir($dbDir, 0755, true);
                }
                
                self::$pdo = new PDO("sqlite:{$dbFile}");
                self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                
                // Enable WAL mode & foreign keys for SQLite
                self::$pdo->exec('PRAGMA journal_mode=WAL');
                self::$pdo->exec('PRAGMA foreign_keys=ON');
                
                // Auto-migrate if new database
                if ($isNew) {
                    self::migrate();
                }
            } else {
                // Auto-create database if it doesn't exist
                $dsnNoDB = "mysql:host={$config['host']};port={$config['port']};charset={$config['charset']}";
                $tmpPdo = new PDO($dsnNoDB, $config['username'], $config['password']);
                $tmpPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $dbName = $config['database'];
                $tmpPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $tmpPdo = null;

                $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
                self::$pdo = new PDO($dsn, $config['username'], $config['password']);
                self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

                // Auto-migrate if tables don't exist
                $tables = self::$pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
                if (empty($tables)) {
                    self::migrate();
                }
            }
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }
    
    /**
     * Run schema migration
     */
    public static function migrate(): void
    {
        $schemaFile = DB_PATH . '/schema.sql';
        if (!file_exists($schemaFile)) return;

        $sql = file_get_contents($schemaFile);
        // Remove comments
        $sql = preg_replace('/--.*$/m', '', $sql);
        // Split on semicolons and execute each statement
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        foreach ($statements as $stmt) {
            if (!empty($stmt)) {
                self::connection()->exec($stmt);
            }
        }
    }
    
    /**
     * Quick query helpers
     */
    public static function query(string $sql, array $params = []): \PDOStatement
    {
        $stmt = self::connection()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }
    
    public static function fetch(string $sql, array $params = []): ?array
    {
        $result = self::query($sql, $params)->fetch();
        return $result ?: null;
    }
    
    public static function insert(string $table, array $data): string
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        self::query($sql, array_values($data));
        
        return self::connection()->lastInsertId();
    }
    
    public static function update(string $table, array $data, string $where, array $whereParams = []): int
    {
        $set = implode(', ', array_map(fn($col) => "{$col} = ?", array_keys($data)));
        $sql = "UPDATE {$table} SET {$set} WHERE {$where}";
        
        $stmt = self::query($sql, array_merge(array_values($data), $whereParams));
        return $stmt->rowCount();
    }
    
    public static function delete(string $table, string $where, array $params = []): int
    {
        $sql = "DELETE FROM {$table} WHERE {$where}";
        return self::query($sql, $params)->rowCount();
    }
}
