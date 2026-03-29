<?php
/**
 * Response - Output helper
 */
class Response
{
    /**
     * Send JSON response
     */
    public static function json($data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    
    /**
     * Send success response
     */
    public static function success($data = null, string $message = 'OK'): void
    {
        self::json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ]);
    }
    
    /**
     * Send error response
     */
    public static function error(string $message, int $code = 400, array $errors = []): void
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];
        if (!empty($errors)) {
            $response['errors'] = $errors;
        }
        self::json($response, $code);
    }
    
    /**
     * Send file download
     */
    public static function download(string $filePath, ?string $fileName = null): void
    {
        if (!file_exists($filePath)) {
            self::error('File not found', 404);
            return;
        }
        
        $fileName = $fileName ?? basename($filePath);
        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
        
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        header('Content-Length: ' . filesize($filePath));
        
        readfile($filePath);
        exit;
    }
}
