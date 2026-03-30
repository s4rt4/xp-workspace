/**
 * Todo List App — Simple task manager with database persistence
 */
Apps.TodoList = {
    open() {
        XP.createWindow('todolist', {
            title: 'Todo List',
            icon: 'to-do-list.png',
            width: 420, height: 460,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.TodoList.clearDone()"><img src="${ICON_PATH}/delete.png" style="width:16px;height:16px" alt="" onerror="this.style.display='none'"> Clear Done</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.TodoList.refresh()"><img src="${ICON_PATH}/forward.png" style="width:16px;height:16px" alt="" onerror="this.style.display='none'"> Refresh</button>
            `,
            statusbar: '<span class="statusbar-section" id="todo-status">0 tasks</span>',
            content: `
                <style>
                    .todo-add { display:flex; gap:4px; margin-bottom:8px; }
                    .todo-add input { flex:1; }
                    .todo-list-wrap { }
                    .todo-item { display:flex; align-items:center; gap:8px; padding:5px 8px; border-bottom:1px solid #f0ece0; font-size:11px; transition:background 0.2s; }
                    .todo-item:hover { background:#f0f8ff; }
                    .todo-item.done { background:#e8f5e9; }
                    .todo-item.done .todo-text { text-decoration:line-through; color:#888; }
                    .todo-check { width:16px; height:16px; cursor:pointer; accent-color:#66bb6a; }
                    .todo-text { flex:1; line-height:1.4; }
                    .todo-del { background:none; border:none; color:#ccc; cursor:pointer; font-size:14px; padding:0 4px; min-width:0; min-height:0; box-shadow:none; transition:color 0.2s; }
                    .todo-del:hover { color:#e53935; }
                    .todo-empty { text-align:center; padding:40px 20px; color:#999; font-size:11px; }
                    .todo-empty img { width:40px; height:40px; opacity:0.3; margin-bottom:8px; }
                </style>
                <div class="todo-add">
                    <input class="xp-input" id="todo-input" placeholder="What needs to be done?" style="flex:1" onkeydown="if(event.key==='Enter')Apps.TodoList.add()">
                    <button class="xp-btn xp-btn-primary" onclick="Apps.TodoList.add()">Add</button>
                </div>
                <div class="todo-list-wrap" id="todo-list"></div>
            `,
            onReady: () => this.refresh(),
        });
    },

    async refresh() {
        const res = await XP.api('/api/todos');
        const todos = res.data || [];
        const el = document.getElementById('todo-list');
        if (!el) return;

        if (todos.length === 0) {
            el.innerHTML = `<div class="todo-empty">
                <img src="${ICON_PATH}/to-do-list.png" alt="">
                <div>No tasks yet. Add one above!</div>
            </div>`;
        } else {
            el.innerHTML = todos.map(t => `
                <div class="todo-item ${t.is_done ? 'done' : ''}" data-id="${t.id}">
                    <input type="checkbox" class="todo-check" ${t.is_done ? 'checked' : ''} onchange="Apps.TodoList.toggle(${t.id}, this.checked)">
                    <span class="todo-text">${esc(t.text)}</span>
                    <button class="todo-del" onclick="Apps.TodoList.remove(${t.id})" title="Delete">✕</button>
                </div>
            `).join('');
        }

        const done = todos.filter(t => t.is_done).length;
        const s = document.getElementById('todo-status');
        if (s) s.textContent = `${todos.length} task(s), ${done} done`;
    },

    async add() {
        const input = document.getElementById('todo-input');
        const text = input?.value?.trim();
        if (!text) return;
        await XP.api('/api/todos', 'POST', { text });
        input.value = '';
        this.refresh();
    },

    async toggle(id, checked) {
        await XP.api(`/api/todos/${id}`, 'PUT', { is_done: checked });
        this.refresh();
    },

    async remove(id) {
        await XP.api(`/api/todos/${id}`, 'DELETE');
        this.refresh();
    },

    async clearDone() {
        const res = await XP.api('/api/todos/clear-done', 'DELETE');
        if (res.data?.deleted > 0) {
            XP.notify('Cleared', `${res.data.deleted} done task(s) removed`);
        }
        this.refresh();
    },
};
