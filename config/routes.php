<?php
/**
 * Route Definitions
 * 
 * $router->get('/path', 'Controller@method');
 * $router->post('/path', 'Controller@method');
 * $router->put('/path', 'Controller@method');
 * $router->delete('/path', 'Controller@method');
 */

// ── Desktop Shell (main page) ──────────────────────────
$router->get('/', 'DesktopController@index');
$router->get('/desktop/config', 'DesktopController@config');
$router->post('/desktop/preferences', 'DesktopController@savePreferences');

// ── Dashboard ──────────────────────────────────────────
$router->get('/api/dashboard', 'DashboardController@index');
$router->get('/api/dashboard/stats', 'DashboardController@stats');

// ── Projects ───────────────────────────────────────────
$router->get('/api/projects', 'ProjectController@index');
$router->post('/api/projects', 'ProjectController@store');
$router->get('/api/projects/{id}', 'ProjectController@show');
$router->put('/api/projects/{id}', 'ProjectController@update');
$router->delete('/api/projects/{id}', 'ProjectController@destroy');

// ── Tasks ──────────────────────────────────────────────
$router->get('/api/tasks', 'TaskController@index');
$router->post('/api/tasks', 'TaskController@store');
$router->get('/api/tasks/{id}', 'TaskController@show');
$router->put('/api/tasks/{id}', 'TaskController@update');
$router->delete('/api/tasks/{id}', 'TaskController@destroy');
$router->put('/api/tasks/{id}/move', 'TaskController@move');
$router->get('/api/tasks/board/{projectId}', 'TaskController@board');

// ── Wiki / Knowledge Base ──────────────────────────────
$router->get('/api/wiki', 'WikiController@index');
$router->post('/api/wiki', 'WikiController@store');
$router->get('/api/wiki/{id}', 'WikiController@show');
$router->put('/api/wiki/{id}', 'WikiController@update');
$router->delete('/api/wiki/{id}', 'WikiController@destroy');
$router->get('/api/wiki/tree', 'WikiController@tree');
$router->get('/api/wiki/search', 'WikiController@search');

// ── Files ──────────────────────────────────────────────
$router->get('/api/files', 'FileController@index');
$router->post('/api/files/upload', 'FileController@upload');
$router->get('/api/files/{id}', 'FileController@show');
$router->delete('/api/files/{id}', 'FileController@destroy');
$router->get('/api/files/{id}/download', 'FileController@download');

// ── Notes (Quick Notes / Sticky Notes) ─────────────────
$router->get('/api/notes', 'NoteController@index');
$router->post('/api/notes', 'NoteController@store');
$router->put('/api/notes/{id}', 'NoteController@update');
$router->delete('/api/notes/{id}', 'NoteController@destroy');

// ── Todo List ─────────────────────────────────────────
$router->get('/api/todos', 'TodoController@index');
$router->post('/api/todos', 'TodoController@store');
$router->delete('/api/todos/clear-done', 'TodoController@clearDone');
$router->put('/api/todos/{id}', 'TodoController@update');
$router->delete('/api/todos/{id}', 'TodoController@destroy');

// ── API Keys Management ───────────────────────────────
$router->get('/api/keys', 'ApiKeyController@index');
$router->post('/api/keys', 'ApiKeyController@save');
$router->put('/api/keys/{id}/toggle', 'ApiKeyController@toggle');
$router->delete('/api/keys/{id}', 'ApiKeyController@destroy');

// ── Weather ───────────────────────────────────────────
$router->get('/api/weather', 'WeatherController@search');

// ── Currency Converter ────────────────────────────────
$router->post('/api/currency/convert', 'CurrencyController@convert');

// ── Translator ────────────────────────────────────────
$router->post('/api/translator/translate', 'TranslatorController@translate');

// ── TV & Radio ────────────────────────────────────────
$router->get('/api/tv/channels', 'MediaController@tvChannels');
$router->get('/api/radio/stations', 'MediaController@radioStations');
$router->post('/api/radio/stations', 'MediaController@radioStore');
$router->put('/api/radio/stations/{id}', 'MediaController@radioUpdate');
$router->delete('/api/radio/stations/{id}', 'MediaController@radioDestroy');

// ── Proxy ─────────────────────────────────────────────
$router->get('/api/proxy/avatar', 'ProxyController@avatar');

// ── Hash Generator ────────────────────────────────────
$router->post('/api/hash/generate', 'HashController@generate');
$router->post('/api/hash/verify', 'HashController@verify');
