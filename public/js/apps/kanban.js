/**
 * Kanban Board — Standalone drag-drop kanban
 */
Apps.Kanban = {
    _boards: [], _activeBoardId: null, _dragItem: null,

    open() {
        if (XP.windows['kanban']) { XP.focusWindow('kanban'); return; }
        try { this._boards = JSON.parse(localStorage.getItem('xp_kanban_boards')) || []; } catch { this._boards = []; }
        if (this._boards.length === 0) this._boards.push({ id: 'b1', name: 'My Board', columns: [{ id: 'c1', name: 'To Do', cards: [] }, { id: 'c2', name: 'In Progress', cards: [] }, { id: 'c3', name: 'Done', cards: [] }] });
        this._activeBoardId = this._boards[0].id;

        XP.createWindow('kanban', {
            title: 'Kanban Board',
            icon: 'checklist.png', width: 850, height: 480,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Kanban.addColumn()"><img src="${ICON_PATH}/add.png" style="width:16px;height:16px" alt=""> Add Column</button>
                <div class="toolbar-separator"></div>
                <select class="xp-select" id="kb-board-sel" onchange="Apps.Kanban.switchBoard(this.value)" style="font-size:10px;max-width:150px"></select>
                <button class="toolbar-btn" onclick="Apps.Kanban.addBoard()">+ Board</button>
            `,
            content: `
                <style>
                    .kb-wrap{display:flex;gap:8px;padding:8px;height:100%;overflow-x:auto;align-items:flex-start}
                    .kb-col{min-width:200px;max-width:260px;background:#ece9d8;border:1px solid #d4d0c8;border-radius:4px;display:flex;flex-direction:column;max-height:100%;flex-shrink:0}
                    .kb-col-header{padding:6px 8px;font-weight:bold;font-size:11px;color:#003c74;display:flex;justify-content:space-between;align-items:center;cursor:grab}
                    .kb-col-header span{font-size:10px;color:#888;font-weight:normal}
                    .kb-col-body{flex:1;overflow-y:auto;padding:4px 6px;min-height:40px}
                    .kb-card{background:#fff;border:1px solid #d4d0c8;padding:6px 8px;margin-bottom:4px;border-radius:3px;font-size:11px;cursor:grab;box-shadow:0 1px 2px rgba(0,0,0,0.05)}
                    .kb-card:hover{border-color:#316ac5}
                    .kb-card.dragging{opacity:0.4}
                    .kb-card-del{float:right;color:#ccc;cursor:pointer;font-size:12px}
                    .kb-card-del:hover{color:#c00}
                    .kb-add-card{padding:4px 8px;font-size:10px;color:#888;cursor:pointer;text-align:center;border-top:1px solid #d4d0c8}
                    .kb-add-card:hover{color:#003c74;background:#e8f0fe}
                    .kb-drop-zone{border:2px dashed #316ac5;border-radius:3px;margin:2px 0;height:4px;transition:height .1s}
                </style>
                <div class="kb-wrap" id="kb-wrap"></div>
            `,
            onReady: () => this._render(),
        });
    },

    _save() { localStorage.setItem('xp_kanban_boards', JSON.stringify(this._boards)); },

    _board() { return this._boards.find(b => b.id === this._activeBoardId); },

    switchBoard(id) { this._activeBoardId = id; this._render(); },

    addBoard() {
        const name = prompt('Board name:', 'New Board');
        if (!name) return;
        const id = 'b' + Date.now();
        this._boards.push({ id, name, columns: [{ id: 'c' + Date.now(), name: 'To Do', cards: [] }] });
        this._activeBoardId = id; this._save(); this._render();
    },

    addColumn() {
        const name = prompt('Column name:', 'New Column');
        if (!name) return;
        this._board().columns.push({ id: 'c' + Date.now(), name, cards: [] });
        this._save(); this._render();
    },

    addCard(colId) {
        const text = prompt('Card text:');
        if (!text) return;
        const col = this._board().columns.find(c => c.id === colId);
        if (col) { col.cards.push({ id: 'k' + Date.now(), text }); this._save(); this._render(); }
    },

    deleteCard(colId, cardId) {
        const col = this._board().columns.find(c => c.id === colId);
        if (col) { col.cards = col.cards.filter(c => c.id !== cardId); this._save(); this._render(); }
    },

    deleteColumn(colId) {
        if (!confirm('Delete column?')) return;
        this._board().columns = this._board().columns.filter(c => c.id !== colId);
        this._save(); this._render();
    },

    _render() {
        const wrap = document.getElementById('kb-wrap');
        const sel = document.getElementById('kb-board-sel');
        if (!wrap) return;

        // Board selector
        if (sel) sel.innerHTML = this._boards.map(b => `<option value="${b.id}" ${b.id === this._activeBoardId ? 'selected' : ''}>${b.name}</option>`).join('');

        const board = this._board();
        if (!board) return;

        wrap.innerHTML = board.columns.map(col => `
            <div class="kb-col" data-colid="${col.id}">
                <div class="kb-col-header">${col.name} <span>${col.cards.length}</span> <span style="cursor:pointer;color:#c00" onclick="Apps.Kanban.deleteColumn('${col.id}')">✕</span></div>
                <div class="kb-col-body" data-colid="${col.id}"
                     ondragover="event.preventDefault();this.style.background='#e0ecff'"
                     ondragleave="this.style.background=''"
                     ondrop="Apps.Kanban._drop(event,'${col.id}');this.style.background=''">
                    ${col.cards.map(card => `
                        <div class="kb-card" draggable="true" data-cardid="${card.id}" data-fromcol="${col.id}"
                             ondragstart="Apps.Kanban._dragStart(event)">
                            <span class="kb-card-del" onclick="Apps.Kanban.deleteCard('${col.id}','${card.id}')">✕</span>
                            ${card.text}
                        </div>
                    `).join('')}
                </div>
                <div class="kb-add-card" onclick="Apps.Kanban.addCard('${col.id}')">+ Add Card</div>
            </div>
        `).join('');
    },

    _dragStart(e) { e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: e.target.dataset.cardid, fromCol: e.target.dataset.fromcol })); e.target.classList.add('dragging'); },

    _drop(e, toColId) {
        e.preventDefault();
        try {
            const { cardId, fromCol } = JSON.parse(e.dataTransfer.getData('text/plain'));
            const board = this._board();
            const from = board.columns.find(c => c.id === fromCol);
            const to = board.columns.find(c => c.id === toColId);
            if (!from || !to) return;
            const idx = from.cards.findIndex(c => c.id === cardId);
            if (idx === -1) return;
            const [card] = from.cards.splice(idx, 1);
            to.cards.push(card);
            this._save(); this._render();
        } catch {}
    },
};
