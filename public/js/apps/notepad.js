/**
 * Notepad App — Tabbed text editor like Windows 11 Notepad
 * Uses TUI Editor (TOAST UI) for rich markdown editing
 */
Apps.Notepad = {
    tabs: [],
    activeTabId: null,
    _counter: 0,
    _editorLoaded: false,

    open() {
        if (XP.windows['notepad']) {
            XP.focusWindow('notepad');
            return;
        }
        this._loadEditor().then(() => this._createWindow());
    },

    _js(u){return new Promise(r=>{if(document.querySelector(`script[src="${u}"]`))return r();const s=document.createElement('script');s.src=u;s.onload=r;document.head.appendChild(s);});},
    _css(u){if(!document.querySelector(`link[href="${u}"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href=u;document.head.appendChild(l);}return Promise.resolve();},

    _loadEditor() {
        if (this._editorLoaded) return Promise.resolve();
        return Promise.all([
            this._css('https://uicdn.toast.com/editor/latest/toastui-editor.min.css'),
            this._js('https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js'),
        ]).then(() => { this._editorLoaded = true; });
    },

    _createWindow() {
        XP.createWindow('notepad', {
            title: 'Notepad',
            icon: 'notepad.png',
            width: 750, height: 520,
            content: `
                <style>
                    .np-wrap { display:flex; flex-direction:column; height:100%; margin:-8px; background:#fff; }

                    /* Tab bar */
                    .np-tabbar { display:flex; align-items:center; background:#f0ece0; border-bottom:1px solid #d4d0c8; min-height:30px; flex-shrink:0; overflow-x:auto; }
                    .np-tab { display:flex; align-items:center; gap:4px; padding:5px 10px; font-size:11px; cursor:pointer; border-right:1px solid #d4d0c8; background:#e8e4d8; white-space:nowrap; max-width:180px; min-height:0; }
                    .np-tab:hover { background:#fff; }
                    .np-tab.active { background:#fff; font-weight:bold; border-bottom:1px solid #fff; margin-bottom:-1px; position:relative; z-index:1; }
                    .np-tab .np-tab-title { overflow:hidden; text-overflow:ellipsis; }
                    .np-tab .np-tab-dot { width:6px; height:6px; border-radius:50%; background:#999; flex-shrink:0; display:none; }
                    .np-tab.modified .np-tab-dot { display:block; background:#4a90d9; }
                    .np-tab .np-tab-close { font-size:12px; color:#999; cursor:pointer; margin-left:4px; padding:0 2px; line-height:1; }
                    .np-tab .np-tab-close:hover { color:#e53935; }
                    .np-tab-new { padding:4px 10px; font-size:14px; cursor:pointer; color:#666; background:transparent; border:none; min-width:0; min-height:0; box-shadow:none; }
                    .np-tab-new:hover { color:#000; background:#e8e4d8; }

                    /* Editor area — neutralize xp.css inside TUI Editor */
                    .np-editor { flex:1; min-height:0; overflow:hidden; }
                    .np-editor .toastui-editor-defaultUI { height:100%; border:none; }

                    /* Reset xp.css button overrides */
                    .np-editor button,
                    .np-editor .toastui-editor-toolbar button,
                    .np-editor .toastui-editor-mode-switch button,
                    .np-editor .toastui-editor-popup button {
                        min-width:unset; min-height:unset; box-shadow:none;
                        border-radius:0; border-image:none;
                    }

                    /* Reset xp.css input/textarea overrides */
                    .np-editor input,
                    .np-editor select,
                    .np-editor textarea,
                    .np-editor .toastui-editor .ProseMirror {
                        min-width:unset; min-height:unset; box-shadow:none;
                        border-image:none;
                    }

                    /* Hide the raw textarea that xp.css makes visible */
                    .np-editor .toastui-editor-defaultUI > .toastui-editor > textarea {
                        display:none !important;
                    }

                    /* Status bar */
                    .np-statusbar { display:flex; align-items:center; padding:2px 8px; background:#ece9d8; border-top:1px solid #d4d0c8; font-size:10px; color:#666; gap:12px; flex-shrink:0; }
                </style>
                <div class="np-wrap">
                    <div class="np-tabbar" id="np-tabbar">
                        <button class="np-tab-new" onclick="Apps.Notepad.newTab()" title="New Tab">+</button>
                    </div>
                    <div class="np-editor" id="np-editor"></div>
                    <div class="np-statusbar">
                        <span id="np-status-file">Untitled</span>
                        <span id="np-status-chars">0 characters</span>
                        <span id="np-status-mode">Markdown</span>
                    </div>
                </div>
            `,
            onReady: () => {
                this.tabs = [];
                this._counter = 0;
                this.newTab();
            },
            onClose: () => {
                this.tabs = [];
                this.activeTabId = null;
            },
        });
    },

    newTab(title, content) {
        const id = ++this._counter;
        const tab = {
            id,
            title: title || 'Untitled',
            content: content || '',
            modified: false,
            editor: null,
        };
        this.tabs.push(tab);
        this._renderTabs();
        this._switchTab(id);
    },

    _renderTabs() {
        const bar = document.getElementById('np-tabbar');
        if (!bar) return;
        const tabsHtml = this.tabs.map(t => `
            <div class="np-tab ${t.id === this.activeTabId ? 'active' : ''} ${t.modified ? 'modified' : ''}"
                 data-tab="${t.id}" onclick="Apps.Notepad._switchTab(${t.id})">
                <span class="np-tab-dot"></span>
                <span class="np-tab-title">${esc(t.title)}</span>
                <span class="np-tab-close" onclick="event.stopPropagation(); Apps.Notepad.closeTab(${t.id})">×</span>
            </div>
        `).join('');
        bar.innerHTML = tabsHtml + '<button class="np-tab-new" onclick="Apps.Notepad.newTab()" title="New Tab">+</button>';
    },

    _switchTab(id) {
        // Save current editor content
        if (this.activeTabId) {
            const current = this.tabs.find(t => t.id === this.activeTabId);
            const editorEl = document.getElementById('np-editor');
            if (current && current.editor) {
                current.content = current.editor.getMarkdown();
            }
        }

        this.activeTabId = id;
        const tab = this.tabs.find(t => t.id === id);
        if (!tab) return;

        this._renderTabs();
        this._initEditor(tab);
        this._updateStatus(tab);
    },

    _initEditor(tab) {
        const container = document.getElementById('np-editor');
        if (!container) return;
        container.innerHTML = '';

        const editorDiv = document.createElement('div');
        editorDiv.id = `np-editor-${tab.id}`;
        container.appendChild(editorDiv);

        tab.editor = new toastui.Editor({
            el: editorDiv,
            height: '100%',
            initialEditType: 'markdown',
            previewStyle: 'tab',
            initialValue: tab.content || '',
            toolbarItems: [
                ['heading', 'bold', 'italic', 'strike'],
                ['hr', 'quote'],
                ['ul', 'ol', 'task'],
                ['table', 'link'],
                ['code', 'codeblock'],
            ],
            events: {
                change: () => {
                    tab.modified = true;
                    this._renderTabs();
                    this._updateStatus(tab);
                },
            },
        });
    },

    _updateStatus(tab) {
        const fileEl = document.getElementById('np-status-file');
        const charsEl = document.getElementById('np-status-chars');
        if (fileEl) fileEl.textContent = tab.title + (tab.modified ? ' •' : '');
        if (charsEl && tab.editor) {
            const text = tab.editor.getMarkdown();
            const lines = text.split('\n').length;
            charsEl.textContent = `${text.length} chars, ${lines} lines`;
        }
    },

    closeTab(id) {
        const idx = this.tabs.findIndex(t => t.id === id);
        if (idx === -1) return;

        const tab = this.tabs[idx];
        if (tab.modified) {
            XP.confirm('Close Tab', `"${tab.title}" has unsaved changes. Close anyway?`).then(ok => {
                if (ok) this._removeTab(idx, id);
            });
        } else {
            this._removeTab(idx, id);
        }
    },

    _removeTab(idx, id) {
        this.tabs.splice(idx, 1);
        if (this.tabs.length === 0) {
            this.newTab();
            return;
        }
        if (this.activeTabId === id) {
            const next = this.tabs[Math.min(idx, this.tabs.length - 1)];
            this._switchTab(next.id);
        } else {
            this._renderTabs();
        }
    },

    // Open file into new tab
    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.markdown,.text,.log,.css,.js,.html,.json,.xml,.yml,.yaml,.toml,.php,.py,.rb,.go,.rs,.java,.c,.cpp,.sh';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.newTab(file.name, e.target.result);
            };
            reader.readAsText(file);
        };
        input.click();
    },

    // Save current tab to file
    saveFile() {
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (!tab || !tab.editor) return;
        const content = tab.editor.getMarkdown();
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = tab.title.endsWith('.md') || tab.title.endsWith('.txt') ? tab.title : tab.title + '.md';
        a.click();
        URL.revokeObjectURL(a.href);
        tab.modified = false;
        this._renderTabs();
        this._updateStatus(tab);
    },
};
