<?php
/**
 * Simple Router with parameter support
 * Supports: GET, POST, PUT, DELETE
 * Parameters: /path/{id} -> extracted as $params['id']
 */
class Router
{
    private array $routes = [];
    
    public function get(string $path, string $action): void
    {
        $this->addRoute('GET', $path, $action);
    }
    
    public function post(string $path, string $action): void
    {
        $this->addRoute('POST', $path, $action);
    }
    
    public function put(string $path, string $action): void
    {
        $this->addRoute('PUT', $path, $action);
    }
    
    public function delete(string $path, string $action): void
    {
        $this->addRoute('DELETE', $path, $action);
    }
    
    private function addRoute(string $method, string $path, string $action): void
    {
        // Convert /path/{id} to regex /path/(?P<id>[^/]+)
        $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $path);
        $pattern = '#^' . $pattern . '$#';
        
        $this->routes[] = [
            'method'  => $method,
            'pattern' => $pattern,
            'action'  => $action,
        ];
    }
    
    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        
        // Support PUT/DELETE via _method field
        if ($method === 'POST' && isset($_POST['_method'])) {
            $method = strtoupper($_POST['_method']);
        }
        
        // Also support via X-HTTP-Method-Override header
        if (isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
            $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
        }
        
        $url = $this->getUrl();
        
        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) continue;
            
            if (preg_match($route['pattern'], $url, $matches)) {
                // Extract named parameters
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                
                $this->callAction($route['action'], $params);
                return;
            }
        }
        
        // 404
        Response::json(['error' => 'Route not found', 'path' => $url], 404);
    }
    
    private function getUrl(): string
    {
        // Method 1: From .htaccess rewrite (?url=path)
        if (isset($_GET['url']) && $_GET['url'] !== '') {
            $url = $_GET['url'];
            return '/' . trim($url, '/');
        }
        
        // Method 2: Parse from REQUEST_URI (fallback for Laragon/Nginx)
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Strip BASE_URL prefix (e.g. /xp-workspace)
        $base = defined('BASE_URL') ? BASE_URL : '';
        if ($base && strpos($uri, $base) === 0) {
            $uri = substr($uri, strlen($base));
        }
        
        // Strip index.php if present
        $uri = preg_replace('#^/index\.php#', '', $uri);
        
        $uri = '/' . trim($uri, '/');
        return $uri === '/' ? '/' : $uri;
    }
    
    private function callAction(string $action, array $params): void
    {
        [$controllerName, $method] = explode('@', $action);
        
        if (!class_exists($controllerName)) {
            Response::json(['error' => "Controller '{$controllerName}' not found"], 500);
            return;
        }
        
        $controller = new $controllerName();
        
        if (!method_exists($controller, $method)) {
            Response::json(['error' => "Method '{$method}' not found in '{$controllerName}'"], 500);
            return;
        }
        
        // Call with params
        call_user_func_array([$controller, $method], $params);
    }
}
