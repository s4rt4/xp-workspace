<?php
class TaskController extends Controller
{
    private Task $task;
    
    public function __construct()
    {
        $this->task = new Task();
    }
    
    public function index(): void
    {
        $projectId = $this->query('project_id');
        $status = $this->query('status');
        $priority = $this->query('priority');
        
        $sql = "SELECT t.*, p.name as project_name, tc.name as column_name 
                FROM tasks t 
                LEFT JOIN projects p ON t.project_id = p.id 
                LEFT JOIN task_columns tc ON t.column_id = tc.id
                WHERE 1=1";
        $params = [];
        
        if ($projectId) { $sql .= " AND t.project_id = ?"; $params[] = $projectId; }
        if ($status)    { $sql .= " AND t.status = ?";     $params[] = $status; }
        if ($priority)  { $sql .= " AND t.priority = ?";   $params[] = $priority; }
        
        $sql .= " ORDER BY t.sort_order ASC, t.created_at DESC";
        
        $this->json(['data' => Database::fetchAll($sql, $params)]);
    }
    
    /**
     * Get kanban board data for a project
     */
    public function board($projectId): void
    {
        $columns = Database::fetchAll(
            "SELECT * FROM task_columns WHERE project_id = ? ORDER BY sort_order",
            [$projectId]
        );
        
        foreach ($columns as &$col) {
            $col['tasks'] = Database::fetchAll(
                "SELECT * FROM tasks WHERE column_id = ? ORDER BY sort_order ASC",
                [$col['id']]
            );
        }
        
        $this->json(['data' => $columns]);
    }
    
    public function store(): void
    {
        $errors = Request::validate(['title', 'project_id']);
        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }
        
        $data = $this->input();
        
        // Default to first column if not specified
        if (empty($data['column_id'])) {
            $firstCol = Database::fetch(
                "SELECT id FROM task_columns WHERE project_id = ? ORDER BY sort_order LIMIT 1",
                [$data['project_id']]
            );
            $data['column_id'] = $firstCol['id'] ?? null;
        }
        
        // Handle tags as JSON
        if (isset($data['tags']) && is_array($data['tags'])) {
            $data['tags'] = json_encode($data['tags']);
        }
        
        $id = $this->task->create($data);
        
        Database::insert('activity_log', [
            'type' => 'task', 'action' => 'created',
            'entity_id' => $id, 'entity_name' => $data['title'],
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        
        Response::success($this->task->find($id), 'Task created');
    }
    
    public function show($id): void
    {
        $task = $this->task->find($id);
        if (!$task) {
            Response::error('Task not found', 404);
            return;
        }
        
        // Parse tags JSON
        $task['tags'] = json_decode($task['tags'] ?? '[]', true);
        
        // Get comments
        $task['comments'] = Database::fetchAll(
            "SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC",
            [$id]
        );
        
        // Get checklist
        $task['checklist'] = Database::fetchAll(
            "SELECT * FROM task_checklists WHERE task_id = ? ORDER BY sort_order ASC",
            [$id]
        );
        
        // Get attached files
        $task['files'] = Database::fetchAll(
            "SELECT * FROM files WHERE linked_type = 'task' AND linked_id = ?",
            [$id]
        );
        
        $this->json(['data' => $task]);
    }
    
    public function update($id): void
    {
        $task = $this->task->find($id);
        if (!$task) {
            Response::error('Task not found', 404);
            return;
        }
        
        $data = $this->input();
        
        // Handle tags
        if (isset($data['tags']) && is_array($data['tags'])) {
            $data['tags'] = json_encode($data['tags']);
        }
        
        // Track completion
        if (isset($data['status']) && $data['status'] === 'done' && $task['status'] !== 'done') {
            $data['completed_at'] = date('Y-m-d H:i:s');
        }
        
        $this->task->update($id, $data);
        
        Database::insert('activity_log', [
            'type' => 'task', 'action' => 'updated',
            'entity_id' => $id, 'entity_name' => $data['title'] ?? $task['title'],
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        
        Response::success($this->task->find($id), 'Task updated');
    }
    
    /**
     * Move task to a different column (drag & drop)
     */
    public function move($id): void
    {
        $task = $this->task->find($id);
        if (!$task) {
            Response::error('Task not found', 404);
            return;
        }
        
        $columnId = $this->input('column_id');
        $sortOrder = $this->input('sort_order', 0);
        
        Database::update('tasks', [
            'column_id'  => $columnId,
            'sort_order' => $sortOrder,
            'updated_at' => date('Y-m-d H:i:s'),
        ], 'id = ?', [$id]);
        
        Response::success(null, 'Task moved');
    }
    
    public function destroy($id): void
    {
        $task = $this->task->find($id);
        if (!$task) {
            Response::error('Task not found', 404);
            return;
        }
        
        $this->task->delete($id);
        
        Database::insert('activity_log', [
            'type' => 'task', 'action' => 'deleted',
            'entity_id' => $id, 'entity_name' => $task['title'],
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        
        Response::success(null, 'Task deleted');
    }
}
