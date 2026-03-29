<?php
/**
 * Base Controller
 * All controllers extend this
 */
class Controller
{
    /**
     * Render a view file
     */
    protected function view(string $view, array $data = []): void
    {
        extract($data);
        $viewFile = APP_PATH . '/views/' . str_replace('.', '/', $view) . '.php';
        
        if (!file_exists($viewFile)) {
            Response::json(['error' => "View '{$view}' not found"], 500);
            return;
        }
        
        ob_start();
        require $viewFile;
        $content = ob_get_clean();
        
        echo $content;
    }
    
    /**
     * Render view inside desktop layout
     */
    protected function desktop(array $data = []): void
    {
        $data['config'] = require CONFIG_PATH . '/app.php';
        $this->view('layouts.desktop', $data);
    }
    
    /**
     * Return JSON response
     */
    protected function json($data, int $code = 200): void
    {
        Response::json($data, $code);
    }
    
    /**
     * Get request input (POST body or JSON)
     */
    protected function input(?string $key = null, $default = null)
    {
        return Request::input($key, $default);
    }
    
    /**
     * Get query string parameter
     */
    protected function query(?string $key = null, $default = null)
    {
        return Request::query($key, $default);
    }
}
