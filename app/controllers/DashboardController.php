<?php
class DashboardController extends Controller
{
    public function index(): void
    {
        $stats = $this->getStats();
        $recentActivity = Database::fetchAll(
            "SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 15"
        );
        $upcomingTasks = Database::fetchAll(
            "SELECT t.*, p.name as project_name FROM tasks t 
             LEFT JOIN projects p ON t.project_id = p.id
             WHERE t.status != 'done' AND t.due_date IS NOT NULL 
             ORDER BY t.due_date ASC LIMIT 10"
        );
        
        $this->json([
            'stats'          => $stats,
            'recent_activity' => $recentActivity,
            'upcoming_tasks'  => $upcomingTasks,
        ]);
    }
    
    public function stats(): void
    {
        $this->json($this->getStats());
    }
    
    private function getStats(): array
    {
        return [
            'total_projects'  => (int)Database::fetch("SELECT COUNT(*) as c FROM projects WHERE status='active'")['c'],
            'total_tasks'     => (int)Database::fetch("SELECT COUNT(*) as c FROM tasks")['c'],
            'open_tasks'      => (int)Database::fetch("SELECT COUNT(*) as c FROM tasks WHERE status != 'done'")['c'],
            'done_tasks'      => (int)Database::fetch("SELECT COUNT(*) as c FROM tasks WHERE status = 'done'")['c'],
            'wiki_pages'      => (int)Database::fetch("SELECT COUNT(*) as c FROM wiki_pages")['c'],
            'total_files'     => (int)Database::fetch("SELECT COUNT(*) as c FROM files")['c'],
            'total_notes'     => (int)Database::fetch("SELECT COUNT(*) as c FROM notes")['c'],
        ];
    }
}
