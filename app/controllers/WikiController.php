<?php
class WikiController extends Controller
{
    private WikiPage $wiki;
    
    public function __construct()
    {
        $this->wiki = new WikiPage();
    }
    
    public function index(): void
    {
        $pages = Database::fetchAll(
            "SELECT id, parent_id, title, slug, icon, is_pinned, updated_at 
             FROM wiki_pages ORDER BY is_pinned DESC, sort_order ASC, title ASC"
        );
        $this->json(['data' => $pages]);
    }
    
    /**
     * Get tree structure for sidebar
     */
    public function tree(): void
    {
        $pages = Database::fetchAll(
            "SELECT id, parent_id, title, slug, icon, is_pinned, sort_order 
             FROM wiki_pages ORDER BY sort_order ASC, title ASC"
        );
        
        $tree = $this->buildTree($pages);
        $this->json(['data' => $tree]);
    }
    
    public function store(): void
    {
        $errors = Request::validate(['title']);
        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }
        
        $data = $this->input();
        $data['slug'] = $this->generateSlug($data['title']);
        
        $id = $this->wiki->create($data);
        
        // Handle tags
        if (!empty($data['tags'])) {
            $this->syncTags($id, $data['tags']);
        }
        
        Database::insert('activity_log', [
            'type' => 'wiki', 'action' => 'created',
            'entity_id' => $id, 'entity_name' => $data['title'],
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        
        Response::success($this->wiki->find($id), 'Page created');
    }
    
    public function show($id): void
    {
        $page = $this->wiki->find($id);
        if (!$page) {
            Response::error('Page not found', 404);
            return;
        }
        
        // Get tags
        $page['tags'] = Database::fetchAll(
            "SELECT t.* FROM wiki_tags t 
             JOIN wiki_page_tags pt ON t.id = pt.tag_id 
             WHERE pt.page_id = ?",
            [$id]
        );
        
        // Get children
        $page['children'] = Database::fetchAll(
            "SELECT id, title, slug, icon FROM wiki_pages WHERE parent_id = ? ORDER BY sort_order ASC",
            [$id]
        );
        
        $this->json(['data' => $page]);
    }
    
    public function update($id): void
    {
        $page = $this->wiki->find($id);
        if (!$page) {
            Response::error('Page not found', 404);
            return;
        }
        
        $data = $this->input();
        if (isset($data['title'])) {
            $data['slug'] = $this->generateSlug($data['title'], $id);
        }
        
        $this->wiki->update($id, $data);
        
        if (isset($data['tags'])) {
            $this->syncTags($id, $data['tags']);
        }
        
        Database::insert('activity_log', [
            'type' => 'wiki', 'action' => 'updated',
            'entity_id' => $id, 'entity_name' => $data['title'] ?? $page['title'],
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        
        Response::success($this->wiki->find($id), 'Page updated');
    }
    
    public function destroy($id): void
    {
        $page = $this->wiki->find($id);
        if (!$page) {
            Response::error('Page not found', 404);
            return;
        }
        
        // Orphan children (move to root)
        Database::query("UPDATE wiki_pages SET parent_id = NULL WHERE parent_id = ?", [$id]);
        
        $this->wiki->delete($id);
        
        Response::success(null, 'Page deleted');
    }
    
    public function search(): void
    {
        $q = $this->query('q', '');
        if (strlen($q) < 2) {
            Response::error('Query too short', 400);
            return;
        }
        
        $results = Database::fetchAll(
            "SELECT id, title, slug, icon, 
                    substr(content, max(1, instr(lower(content), lower(?)) - 50), 150) as snippet
             FROM wiki_pages 
             WHERE title LIKE ? OR content LIKE ?
             ORDER BY is_pinned DESC, updated_at DESC
             LIMIT 20",
            [$q, "%{$q}%", "%{$q}%"]
        );
        
        $this->json(['data' => $results]);
    }
    
    // ── Helpers ─────────────────────────────────────────
    
    private function buildTree(array $pages, ?int $parentId = null): array
    {
        $tree = [];
        foreach ($pages as $page) {
            if ($page['parent_id'] == $parentId) {
                $page['children'] = $this->buildTree($pages, $page['id']);
                $tree[] = $page;
            }
        }
        return $tree;
    }
    
    private function generateSlug(string $title, ?int $excludeId = null): string
    {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $title), '-'));
        
        $check = Database::fetch(
            "SELECT id FROM wiki_pages WHERE slug = ?" . ($excludeId ? " AND id != ?" : ""),
            $excludeId ? [$slug, $excludeId] : [$slug]
        );
        
        if ($check) {
            $slug .= '-' . time();
        }
        
        return $slug;
    }
    
    private function syncTags(int $pageId, array $tagNames): void
    {
        Database::query("DELETE FROM wiki_page_tags WHERE page_id = ?", [$pageId]);
        
        foreach ($tagNames as $name) {
            $name = trim($name);
            if (empty($name)) continue;
            
            $tag = Database::fetch("SELECT id FROM wiki_tags WHERE name = ?", [$name]);
            if (!$tag) {
                $tagId = Database::insert('wiki_tags', ['name' => $name]);
            } else {
                $tagId = $tag['id'];
            }
            
            Database::insert('wiki_page_tags', ['page_id' => $pageId, 'tag_id' => $tagId]);
        }
    }
}
