<?php
/**
 * Request - Input handling helper
 */
class Request
{
    private static ?array $jsonBody = null;
    
    /**
     * Get POST/JSON input
     */
    public static function input(?string $key = null, $default = null)
    {
        $data = self::body();
        
        if ($key === null) return $data;
        return $data[$key] ?? $default;
    }
    
    /**
     * Get query string parameter
     */
    public static function query(?string $key = null, $default = null)
    {
        if ($key === null) return $_GET;
        return $_GET[$key] ?? $default;
    }
    
    /**
     * Get request body (supports JSON & form data)
     */
    public static function body(): array
    {
        if (self::$jsonBody !== null) return self::$jsonBody;
        
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        if (strpos($contentType, 'application/json') !== false) {
            $raw = file_get_contents('php://input');
            self::$jsonBody = json_decode($raw, true) ?? [];
        } else {
            // Merge POST and php://input for PUT/DELETE
            $raw = file_get_contents('php://input');
            parse_str($raw, $parsed);
            self::$jsonBody = array_merge($_POST, $parsed);
        }
        
        return self::$jsonBody;
    }
    
    /**
     * Get uploaded file
     */
    public static function file(string $name): ?array
    {
        return $_FILES[$name] ?? null;
    }
    
    /**
     * Get request method
     */
    public static function method(): string
    {
        return $_SERVER['REQUEST_METHOD'];
    }
    
    /**
     * Check if request is AJAX/JSON
     */
    public static function isAjax(): bool
    {
        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) 
            && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
            || strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
    }
    
    /**
     * Validate required fields
     */
    public static function validate(array $required): array
    {
        $errors = [];
        $data = self::body();
        
        foreach ($required as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                $errors[] = "Field '{$field}' is required";
            }
        }
        
        return $errors;
    }
}
