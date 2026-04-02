/**
 * Bookmark Manager — Save and organize URLs with tags
 */
Apps.Bookmarks = {
    _bookmarks: [], _filter: '',

    open() {
        if (XP.windows['bookmarks']) { XP.focusWindow('bookmarks'); return; }
        try { this._bookmarks = JSON.parse(localStorage.getItem('xp_bookmarks')) || []; } catch { this._bookmarks = []; }

        XP.createWindow('bookmarks', {
            title: 'Bookmark Manager',
            icon: 'favorites.png', width: 600, height: 420,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Bookmarks.add()"><img src="${ICON_PATH}/add.png" style="width:16px;height:16px" alt=""> Add</button>
                <div class="toolbar-separator"></div>
                <input class="xp-input" id="bm-search" placeholder="Search..." style="width:150px;font-size:10px" oninput="Apps.Bookmarks._filter=this.value;Apps.Bookmarks._render()">
            `,
            statusbar: '<span id="bm-status">0 bookmarks</span>',
            content: `
                <style>
                    .bm-list{height:100%;overflow-y:auto;font-size:11px}
                    .bm-item{display:flex;align-items:center;gap:8px;padding:5px 10px;border-bottom:1px solid #f0ece0;cursor:pointer}
                    .bm-item:hover{background:#e8f0fe}
                    .bm-favicon{width:16px;height:16px;flex-shrink:0}
                    .bm-info{flex:1;min-width:0}
                    .bm-title{font-weight:bold;color:#003c74;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                    .bm-url{font-size:10px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                    .bm-tags{display:flex;gap:3px;margin-top:2px}
                    .bm-tag{font-size:9px;padding:1px 6px;border-radius:8px;background:#e8f0fe;color:#316ac5}
                    .bm-del{color:#ccc;cursor:pointer;font-size:14px;flex-shrink:0}
                    .bm-del:hover{color:#c00}
                    .bm-empty{text-align:center;padding:40px;color:#888}
                </style>
                <div class="bm-list" id="bm-list"></div>
            `,
            onReady: () => this._render(),
        });
    },

    _save() { localStorage.setItem('xp_bookmarks', JSON.stringify(this._bookmarks)); },

    add() {
        const url = prompt('URL:', 'https://');
        if (!url) return;
        const title = prompt('Title:', url.replace(/https?:\/\//, '').split('/')[0]);
        if (!title) return;
        const tags = prompt('Tags (comma separated):', '')?.split(',').map(t => t.trim()).filter(Boolean) || [];
        this._bookmarks.unshift({ id: 'bm' + Date.now(), url, title, tags, created: new Date().toISOString() });
        this._save(); this._render();
    },

    remove(id) {
        this._bookmarks = this._bookmarks.filter(b => b.id !== id);
        this._save(); this._render();
    },

    openUrl(url) { window.open(url, '_blank'); },

    _render() {
        const el = document.getElementById('bm-list');
        const status = document.getElementById('bm-status');
        if (!el) return;

        let filtered = this._bookmarks;
        if (this._filter) {
            const q = this._filter.toLowerCase();
            filtered = filtered.filter(b => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) || b.tags.some(t => t.toLowerCase().includes(q)));
        }

        status.textContent = `${filtered.length} bookmark${filtered.length !== 1 ? 's' : ''}`;

        if (filtered.length === 0) { el.innerHTML = '<div class="bm-empty">No bookmarks. Click "Add" to create one.</div>'; return; }

        el.innerHTML = filtered.map(b => {
            const domain = b.url.replace(/https?:\/\//, '').split('/')[0];
            return `<div class="bm-item" ondblclick="Apps.Bookmarks.openUrl('${b.url.replace(/'/g, "\\'")}')">
                <img class="bm-favicon" src="https://www.google.com/s2/favicons?domain=${domain}&sz=16" onerror="this.src='${ICON_PATH}/generic-document.png'" alt="">
                <div class="bm-info">
                    <div class="bm-title">${b.title}</div>
                    <div class="bm-url">${b.url}</div>
                    ${b.tags.length ? '<div class="bm-tags">' + b.tags.map(t => `<span class="bm-tag">${t}</span>`).join('') + '</div>' : ''}
                </div>
                <span class="bm-del" onclick="event.stopPropagation();Apps.Bookmarks.remove('${b.id}')">✕</span>
            </div>`;
        }).join('');
    },
};
