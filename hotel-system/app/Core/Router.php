<?php
namespace App\Core;

/**
 * Simple Router Class
 */
class Router
{
    private array $routes = [];
    
    public function get(string $path, callable|array $handler): void
    {
        $this->routes['GET'][$path] = $handler;
    }
    
    public function post(string $path, callable|array $handler): void
    {
        $this->routes['POST'][$path] = $handler;
    }
    
    public function put(string $path, callable|array $handler): void
    {
        $this->routes['PUT'][$path] = $handler;
    }
    
    public function delete(string $path, callable|array $handler): void
    {
        $this->routes['DELETE'][$path] = $handler;
    }
    
    public function dispatch(string $uri, string $method): void
    {
        // Remove query string
        $uri = parse_url($uri, PHP_URL_PATH);
        
        // Normalize URI
        $uri = rtrim($uri, '/') ?: '/';
        
        if (!isset($this->routes[$method][$uri])) {
            // Check for dynamic routes (simplified)
            $handler = $this->findDynamicRoute($uri, $method);
            
            if ($handler === null) {
                http_response_code(404);
                echo $this->renderView('errors/404');
                return;
            }
        } else {
            $handler = $this->routes[$method][$uri];
        }
        
        // Call handler
        if (is_callable($handler)) {
            call_user_func($handler);
        } elseif (is_array($handler)) {
            [$controller, $action] = $handler;
            if (class_exists($controller)) {
                $instance = new $controller();
                call_user_func([$instance, $action]);
            } else {
                throw new \Exception("Controller not found: $controller");
            }
        }
    }
    
    private function findDynamicRoute(string $uri, string $method): ?callable|array
    {
        // Simplified dynamic routing - can be expanded
        foreach ($this->routes[$method] ?? [] as $route => $handler) {
            if (preg_match('#^' . preg_replace('/\{[^}]+\}/', '([^/]+)', $route) . '$#', $uri, $matches)) {
                array_shift($matches); // Remove full match
                $_ROUTE_PARAMS = $matches;
                return $handler;
            }
        }
        return null;
    }
    
    public function renderView(string $view, array $data = []): string
    {
        extract($data);
        ob_start();
        include BASE_PATH . "/app/Views/{$view}.php";
        return ob_get_clean();
    }
}
