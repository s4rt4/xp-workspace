/**
 * Invoice Sorter — Browse, preview, reorder PDF invoices
 */
Apps.Invoice = {
    files: [],
    currentIdx: -1,

    open() {
        XP.createWindow('invoice', {
            title: 'Invoice Sorter',
            icon: 'generic-document.png',
            width: 850, height: 520,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Invoice.loadFolder()"><img src="${ICON_PATH}/folder-opened.png" style="width:16px;height:16px" alt=""> Open Folder</button>
            `,
            statusbar: '<span class="statusbar-section" id="inv-status">Open a folder with PDF files</span>',
            content: `
                <style>
                    .inv-layout { display:flex; height:100%; margin:-8px; }
                    .inv-sidebar { width:260px; background:#f5f3e8; border-right:1px solid #d4d0c8; display:flex; flex-direction:column; flex-shrink:0; }
                    .inv-sidebar-header { padding:6px 8px; background:#ece9d8; border-bottom:1px solid #d4d0c8; font-size:10px; color:#666; display:flex; justify-content:space-between; }
                    .inv-list { flex:1; overflow-y:auto; padding:2px; }
                    .inv-item { display:flex; align-items:center; gap:6px; padding:5px 8px; cursor:pointer; font-size:11px; border:1px solid transparent; border-radius:2px; margin-bottom:1px; }
                    .inv-item:hover { background:#e8f0fe; }
                    .inv-item.active { background:#316ac5; color:#fff; }
                    .inv-item.checked { background:#d4edda; }
                    .inv-item.checked.active { background:#1a8a3a; color:#fff; }
                    .inv-item input[type="checkbox"] { width:14px; height:14px; accent-color:#27ae60; appearance:auto; -webkit-appearance:checkbox; flex-shrink:0; }
                    .inv-item .inv-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
                    .inv-item .inv-note { width:50px; font-size:10px; border:1px solid #ccc; padding:1px 3px; background:#fff; border-radius:2px; }
                    .inv-item.active .inv-note { border-color:#fff; }
                    .inv-preview { flex:1; background:#888; display:flex; align-items:center; justify-content:center; }
                    .inv-preview iframe { width:100%; height:100%; border:none; }
                    .inv-empty { color:#ddd; font-size:12px; text-align:center; }
                </style>
                <div class="inv-layout">
                    <div class="inv-sidebar">
                        <div class="inv-sidebar-header"><span id="inv-count">0 files</span></div>
                        <div class="inv-list" id="inv-list"></div>
                    </div>
                    <div class="inv-preview" id="inv-preview">
                        <div class="inv-empty">Select a PDF to preview</div>
                    </div>
                </div>
                <input type="file" id="inv-folder" webkitdirectory multiple accept=".pdf" style="display:none" onchange="Apps.Invoice.handleFolder(this)">
            `,
        });
    },

    loadFolder() { document.getElementById('inv-folder')?.click(); },

    handleFolder(input) {
        this.files = Array.from(input.files || []).filter(f => f.name.toLowerCase().endsWith('.pdf'))
            .map((f, i) => ({ file: f, name: f.name, checked: false, note: '', idx: i }));
        this.currentIdx = -1;
        this._renderList();
        input.value = '';
        document.getElementById('inv-count').textContent = `${this.files.length} PDF(s)`;
        document.getElementById('inv-status').textContent = `${this.files.length} PDF files loaded`;
    },

    _renderList() {
        const el = document.getElementById('inv-list');
        if (!el) return;
        el.innerHTML = this.files.map((f, i) => `
            <div class="inv-item ${i === this.currentIdx ? 'active' : ''} ${f.checked ? 'checked' : ''}" onclick="Apps.Invoice.select(${i})">
                <input type="checkbox" ${f.checked ? 'checked' : ''} onclick="event.stopPropagation(); Apps.Invoice.toggleCheck(${i}, this.checked)">
                <span class="inv-name">${esc(f.name)}</span>
                <input class="inv-note" placeholder="#" value="${esc(f.note)}" onclick="event.stopPropagation()" onchange="Apps.Invoice.setNote(${i}, this.value)">
            </div>
        `).join('');
    },

    select(idx) {
        this.currentIdx = idx;
        const f = this.files[idx];
        if (!f) return;
        const preview = document.getElementById('inv-preview');
        const url = URL.createObjectURL(f.file);
        preview.innerHTML = `<iframe src="${url}"></iframe>`;
        this._renderList();
    },

    toggleCheck(idx, checked) {
        if (this.files[idx]) { this.files[idx].checked = checked; this._renderList(); }
    },

    setNote(idx, val) {
        if (this.files[idx]) this.files[idx].note = val;
    },
};
