<?php
class TodoController extends Controller
{
    public function index(): void
    {
        $todos = Database::fetchAll("SELECT * FROM todos ORDER BY is_done ASC, sort_order ASC, id DESC");
        Response::success($todos);
    }

    public function store(): void
    {
        $data = Request::body();
        $text = trim($data['text'] ?? '');

        if (empty($text)) {
            Response::error('Text is required');
            return;
        }

        $id = Database::insert('todos', [
            'text' => $text,
            'is_done' => 0,
        ]);

        $todo = Database::fetch("SELECT * FROM todos WHERE id = ?", [$id]);
        Response::success($todo, 'Todo added');
    }

    public function update($id): void
    {
        $data = Request::body();
        $fields = [];

        if (isset($data['text'])) {
            $fields['text'] = $data['text'];
        }
        if (isset($data['is_done'])) {
            $fields['is_done'] = $data['is_done'] ? 1 : 0;
        }

        if (empty($fields)) {
            Response::error('Nothing to update');
            return;
        }

        Database::update('todos', $fields, 'id = ?', [$id]);
        $todo = Database::fetch("SELECT * FROM todos WHERE id = ?", [$id]);
        Response::success($todo, 'Todo updated');
    }

    public function destroy($id): void
    {
        Database::delete('todos', 'id = ?', [$id]);
        Response::success(null, 'Todo deleted');
    }

    public function clearDone(): void
    {
        $count = Database::delete('todos', 'is_done = 1', []);
        Response::success(['deleted' => $count], 'Cleared done todos');
    }
}
