<?php
class ProjectController extends Controller
{
    private Project $project;
    
    public function __construct()
    {
        $this->project = new Project();
    }
    
    public function index(): void
    {
        $status = $this->query('status', 'active');
        $projects = Database::fetchAll(
            "SELECT p.*, 
                (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
                (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count
             FROM projects p 
             WHERE p.status = ?
             ORDER BY p.sort_order ASC, p.created_at DESC",
            [$status]
        );
        
        $this->json(['data' => $projects]);
    }
    
    public function store(): void
    {
        $errors = Request::validate(['name']);
        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }
        
        $id = $this->project->create($this->input());
        
        // Create default columns
        $columns = ['To Do', 'In Progress', 'Review', 'Done'];
        $colors  = ['#E8E8E8', '#BDE0FE', '#FFF3BF', '#D4EDDA'];
        foreach ($columns as $i => $name) {
            Database::insert('task_columns', [
                'project_id' => $id,
                'name'       => $name,
                'color'      => $colors[$i],
                'sort_order' => $i,
            ]);
        }
        
        // Log activity
        $this->logActivity('project', 'created', $id, $this->input('name'));
        
        Response::success($this->project->find($id), 'Project created');
    }
    
    public function show($id): void
    {
        $project = $this->project->find($id);
        if (!$project) {
            Response::error('Project not found', 404);
            return;
        }
        
        $project['columns'] = Database::fetchAll(
            "SELECT * FROM task_columns WHERE project_id = ? ORDER BY sort_order",
            [$id]
        );
        
        $this->json(['data' => $project]);
    }
    
    public function update($id): void
    {
        $project = $this->project->find($id);
        if (!$project) {
            Response::error('Project not found', 404);
            return;
        }
        
        $this->project->update($id, $this->input());
        $this->logActivity('project', 'updated', $id, $this->input('name', $project['name']));
        
        Response::success($this->project->find($id), 'Project updated');
    }
    
    public function destroy($id): void
    {
        $project = $this->project->find($id);
        if (!$project) {
            Response::error('Project not found', 404);
            return;
        }
        
        $this->project->delete($id);
        $this->logActivity('project', 'deleted', $id, $project['name']);
        
        Response::success(null, 'Project deleted');
    }
    
    private function logActivity(string $type, string $action, $entityId, string $name): void
    {
        Database::insert('activity_log', [
            'type'        => $type,
            'action'      => $action,
            'entity_id'   => $entityId,
            'entity_name' => $name,
            'created_at'  => date('Y-m-d H:i:s'),
        ]);
    }
}
