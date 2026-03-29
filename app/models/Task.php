<?php
class Task extends Model
{
    protected string $table = 'tasks';
    protected array $fillable = [
        'project_id', 'column_id', 'title', 'description', 
        'priority', 'status', 'due_date', 'tags', 'assignee', 
        'sort_order', 'completed_at'
    ];
}
