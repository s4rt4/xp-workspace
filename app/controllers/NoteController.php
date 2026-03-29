<?php
class NoteController extends Controller
{
    private Note $note;
    
    public function __construct()
    {
        $this->note = new Note();
    }
    
    public function index(): void
    {
        $notes = $this->note->all('is_pinned DESC, updated_at DESC');
        $this->json(['data' => $notes]);
    }
    
    public function store(): void
    {
        $data = $this->input();
        $id = $this->note->create($data);
        Response::success($this->note->find($id), 'Note created');
    }
    
    public function update($id): void
    {
        $note = $this->note->find($id);
        if (!$note) {
            Response::error('Note not found', 404);
            return;
        }
        $this->note->update($id, $this->input());
        Response::success($this->note->find($id), 'Note updated');
    }
    
    public function destroy($id): void
    {
        $note = $this->note->find($id);
        if (!$note) {
            Response::error('Note not found', 404);
            return;
        }
        $this->note->delete($id);
        Response::success(null, 'Note deleted');
    }
}
