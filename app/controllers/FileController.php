<?php
class FileController extends Controller
{
    public function index(): void
    {
        $folder = $this->query('folder', '/');
        $files = Database::fetchAll(
            "SELECT * FROM files WHERE folder = ? ORDER BY name ASC",
            [$folder]
        );
        
        // Get subfolders
        $folders = Database::fetchAll(
            "SELECT DISTINCT folder FROM files WHERE folder LIKE ? AND folder != ?",
            [$folder . '%', $folder]
        );
        
        $this->json(['data' => $files, 'folders' => $folders, 'current_folder' => $folder]);
    }
    
    public function upload(): void
    {
        $file = Request::file('file');
        if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
            Response::error('No file uploaded or upload error');
            return;
        }
        
        $folder = Request::input('folder', '/');
        $originalName = $file['name'];
        $ext = pathinfo($originalName, PATHINFO_EXTENSION);
        $storedName = uniqid('file_') . '.' . $ext;
        $destPath = STORAGE_PATH . '/uploads/' . $storedName;
        
        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            Response::error('Failed to save file');
            return;
        }
        
        $id = Database::insert('files', [
            'name'          => $storedName,
            'original_name' => $originalName,
            'path'          => $destPath,
            'mime_type'     => $file['type'],
            'size'          => $file['size'],
            'folder'        => $folder,
            'linked_type'   => Request::input('linked_type'),
            'linked_id'     => Request::input('linked_id'),
            'created_at'    => date('Y-m-d H:i:s'),
        ]);
        
        Database::insert('activity_log', [
            'type' => 'file', 'action' => 'uploaded',
            'entity_id' => $id, 'entity_name' => $originalName,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        
        Response::success(Database::fetch("SELECT * FROM files WHERE id = ?", [$id]), 'File uploaded');
    }
    
    public function show($id): void
    {
        $file = Database::fetch("SELECT * FROM files WHERE id = ?", [$id]);
        if (!$file) {
            Response::error('File not found', 404);
            return;
        }
        $this->json(['data' => $file]);
    }
    
    public function download($id): void
    {
        $file = Database::fetch("SELECT * FROM files WHERE id = ?", [$id]);
        if (!$file || !file_exists($file['path'])) {
            Response::error('File not found', 404);
            return;
        }
        Response::download($file['path'], $file['original_name']);
    }
    
    public function destroy($id): void
    {
        $file = Database::fetch("SELECT * FROM files WHERE id = ?", [$id]);
        if (!$file) {
            Response::error('File not found', 404);
            return;
        }
        
        if (file_exists($file['path'])) {
            unlink($file['path']);
        }
        
        Database::delete('files', 'id = ?', [$id]);
        Response::success(null, 'File deleted');
    }
}
