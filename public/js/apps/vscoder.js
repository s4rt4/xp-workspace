/**
 * VSCoder — Monaco Editor embedded in XP Window
 * Full code editor with tabs, file tree, minimap, intellisense
 */
Apps.VSCoder = {
    _monacoLoaded: false,
    tabs: [],
    activeTabId: null,
    _counter: 0,

    langMap: {
        js:'javascript', ts:'typescript', py:'python', rb:'ruby', java:'java', c:'c', cpp:'cpp',
        cs:'csharp', go:'go', rs:'rust', php:'php', html:'html', css:'css', json:'json',
        xml:'xml', md:'markdown', sql:'sql', sh:'shell', yml:'yaml', yaml:'yaml', toml:'toml',
        dart:'dart', kt:'kotlin', swift:'swift', lua:'lua', txt:'plaintext',
    },

    open() {
        if (XP.windows['vscoder']) { XP.focusWindow('vscoder'); return; }
        this._loadMonaco().then(() => this._createWindow());
    },

    _loadMonaco() {
        if (this._monacoLoaded) return Promise.resolve();
        return new Promise((resolve) => {
            const loaderScript = document.createElement('script');
            loaderScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
            loaderScript.onload = () => {
                require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
                require(['vs/editor/editor.main'], () => {
                    this._monacoLoaded = true;
                    resolve();
                });
            };
            document.head.appendChild(loaderScript);
        });
    },

    _createWindow() {
        XP.createWindow('vscoder', {
            title: 'VSCoder',
            icon: 'vscode.png',
            width: 950, height: 600,
            content: `
                <style>
                    .vs-wrap { display:flex; flex-direction:column; height:100%; margin:-8px; background:#1e1e1e; }

                    /* Menu bar */
                    .vs-menubar { display:flex; align-items:center; background:#323233; padding:0 6px; height:28px; flex-shrink:0; gap:0; }
                    .vs-menu-item { color:#ccc; font-size:11px; padding:4px 8px; cursor:pointer; border-radius:3px; }
                    .vs-menu-item:hover { background:#505050; color:#fff; }
                    .vs-menubar-title { flex:1; text-align:center; color:#888; font-size:11px; }

                    /* Tab bar */
                    .vs-tabbar { display:flex; align-items:center; background:#252526; min-height:32px; overflow-x:auto; flex-shrink:0; }
                    .vs-tab { display:flex; align-items:center; gap:4px; padding:6px 12px; font-size:11px; color:#969696; cursor:pointer; border-right:1px solid #1e1e1e; background:#2d2d2d; white-space:nowrap; }
                    .vs-tab:hover { background:#2a2d2e; }
                    .vs-tab.active { background:#1e1e1e; color:#fff; border-top:1px solid #007acc; margin-top:-1px; }
                    .vs-tab .vs-tab-dot { width:8px; height:8px; border-radius:50%; display:none; }
                    .vs-tab.modified .vs-tab-dot { display:block; background:#c5c5c5; }
                    .vs-tab .vs-tab-close { font-size:14px; margin-left:6px; color:#969696; cursor:pointer; line-height:1; }
                    .vs-tab .vs-tab-close:hover { color:#fff; }
                    .vs-tab .vs-tab-icon { width:14px; height:14px; flex-shrink:0; }

                    /* Body */
                    .vs-body { display:flex; flex:1; min-height:0; }

                    /* Sidebar */
                    .vs-sidebar { width:220px; background:#252526; border-right:1px solid #1e1e1e; display:flex; flex-direction:column; flex-shrink:0; overflow:hidden; }
                    .vs-sidebar.hidden { width:0; border:none; }
                    .vs-sidebar-header { color:#bbb; font-size:10px; text-transform:uppercase; letter-spacing:1px; padding:8px 12px; font-weight:bold; }
                    .vs-file-list { flex:1; overflow-y:auto; padding:0 4px; }
                    .vs-file-item { display:flex; align-items:center; gap:6px; padding:3px 8px; color:#ccc; font-size:11px; cursor:pointer; border-radius:3px; }
                    .vs-file-item:hover { background:#2a2d2e; }
                    .vs-file-item.active { background:#094771; color:#fff; }
                    .vs-file-item .vs-fi-icon { width:14px; height:14px; }

                    /* Editor */
                    .vs-editor-area { flex:1; min-width:0; position:relative; }
                    .vs-welcome { display:flex; align-items:center; justify-content:center; height:100%; color:#555; font-size:13px; flex-direction:column; gap:8px; }
                    .vs-welcome img { width:48px; height:48px; opacity:0.3; }

                    /* Statusbar */
                    .vs-statusbar { display:flex; align-items:center; background:#007acc; color:#fff; font-size:11px; height:22px; padding:0 10px; gap:12px; flex-shrink:0; }
                    .vs-statusbar .vs-sb-right { margin-left:auto; display:flex; gap:12px; }

                    /* Dropdown menus */
                    .vs-dropdown { display:none; position:absolute; top:28px; background:#323233; border:1px solid #454545; box-shadow:0 4px 12px rgba(0,0,0,0.5); z-index:100; min-width:200px; padding:4px 0; }
                    .vs-dropdown.show { display:block; }
                    .vs-dd-item { padding:4px 24px; color:#ccc; font-size:11px; cursor:pointer; display:flex; justify-content:space-between; }
                    .vs-dd-item:hover { background:#094771; color:#fff; }
                    .vs-dd-sep { height:1px; background:#454545; margin:4px 0; }
                    .vs-dd-shortcut { color:#888; font-size:10px; }
                </style>
                <div class="vs-wrap" onclick="Apps.VSCoder._closeMenus(event)">
                    <div class="vs-menubar">
                        <div class="vs-menu-item" onclick="Apps.VSCoder._toggleMenu('file',event)">File</div>
                        <div class="vs-menu-item" onclick="Apps.VSCoder._toggleMenu('edit',event)">Edit</div>
                        <div class="vs-menu-item" onclick="Apps.VSCoder._toggleMenu('view',event)">View</div>
                        <div class="vs-menubar-title">VSCoder</div>
                    </div>

                    <!-- Dropdown menus -->
                    <div class="vs-dropdown" id="vs-menu-file" style="left:6px">
                        <div class="vs-dd-item" onclick="Apps.VSCoder.newTab()">New File <span class="vs-dd-shortcut">Ctrl+N</span></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder.openFile()">Open File <span class="vs-dd-shortcut">Ctrl+O</span></div>
                        <div class="vs-dd-sep"></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder.saveFile()">Save <span class="vs-dd-shortcut">Ctrl+S</span></div>
                        <div class="vs-dd-sep"></div>
                        <div class="vs-dd-item" onclick="XP.closeWindow('vscoder')">Close Window</div>
                    </div>
                    <div class="vs-dropdown" id="vs-menu-edit" style="left:40px">
                        <div class="vs-dd-item" onclick="Apps.VSCoder._editorAction('editor.action.formatDocument')">Format Document <span class="vs-dd-shortcut">Shift+Alt+F</span></div>
                        <div class="vs-dd-sep"></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._editorAction('actions.find')">Find <span class="vs-dd-shortcut">Ctrl+F</span></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._editorAction('editor.action.startFindReplaceAction')">Replace <span class="vs-dd-shortcut">Ctrl+H</span></div>
                        <div class="vs-dd-sep"></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._toggleWordWrap()">Toggle Word Wrap <span class="vs-dd-shortcut">Alt+Z</span></div>
                    </div>
                    <div class="vs-dropdown" id="vs-menu-view" style="left:76px">
                        <div class="vs-dd-item" onclick="Apps.VSCoder._toggleSidebar()">Toggle Sidebar <span class="vs-dd-shortcut">Ctrl+B</span></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._toggleMinimap()">Toggle Minimap</div>
                        <div class="vs-dd-sep"></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._setTheme('vs-dark')">Dark Theme</div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._setTheme('vs')">Light Theme</div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._setTheme('hc-black')">High Contrast</div>
                    </div>

                    <div class="vs-tabbar" id="vs-tabbar"></div>
                    <div class="vs-body">
                        <div class="vs-sidebar" id="vs-sidebar">
                            <div class="vs-sidebar-header">Open Files</div>
                            <div class="vs-file-list" id="vs-file-list"></div>
                        </div>
                        <div class="vs-editor-area" id="vs-editor-area">
                            <div class="vs-welcome"><img src="${ICON_PATH}/vscode.png" alt=""><div>Press Ctrl+N or click File → New File</div></div>
                        </div>
                    </div>
                    <div class="vs-statusbar">
                        <span id="vs-sb-lang">Plain Text</span>
                        <span id="vs-sb-pos">Ln 1, Col 1</span>
                        <span class="vs-sb-right">
                            <span id="vs-sb-encoding">UTF-8</span>
                            <span id="vs-sb-indent">Spaces: 2</span>
                        </span>
                    </div>
                </div>
            `,
            onReady: () => {
                this.tabs = [];
                this._counter = 0;
                this._initKeyboard();
            },
            onClose: () => { this.tabs = []; this.activeTabId = null; },
        });
    },

    // ═══════ TABS ═══════
    newTab(title, content, lang) {
        const id = ++this._counter;
        const tab = { id, title: title || `untitled-${id}`, content: content || '', lang: lang || 'plaintext', modified: false, editor: null, model: null, viewState: null };
        this.tabs.push(tab);
        this._renderTabs();
        this._switchTab(id);
    },

    _renderTabs() {
        const bar = document.getElementById('vs-tabbar');
        if (!bar) return;
        bar.innerHTML = this.tabs.map(t => {
            const ext = t.title.split('.').pop().toLowerCase();
            const iconSrc = this.langMap[ext] ? `${ICON_PATH}/filetypes/${ext}.png` : `${ICON_PATH}/generic-text-document.png`;
            return `<div class="vs-tab ${t.id === this.activeTabId ? 'active' : ''} ${t.modified ? 'modified' : ''}" onclick="Apps.VSCoder._switchTab(${t.id})">
                <span class="vs-tab-dot"></span>
                <img class="vs-tab-icon" src="${iconSrc}" onerror="this.src='${ICON_PATH}/generic-text-document.png'" alt="">
                <span>${esc(t.title)}</span>
                <span class="vs-tab-close" onclick="event.stopPropagation();Apps.VSCoder.closeTab(${t.id})">×</span>
            </div>`;
        }).join('');
        this._renderFileList();
    },

    _renderFileList() {
        const list = document.getElementById('vs-file-list');
        if (!list) return;
        list.innerHTML = this.tabs.map(t => `
            <div class="vs-file-item ${t.id === this.activeTabId ? 'active' : ''}" onclick="Apps.VSCoder._switchTab(${t.id})">
                <span>${esc(t.title)}${t.modified ? ' •' : ''}</span>
            </div>
        `).join('');
    },

    _switchTab(id) {
        // Save viewState of current
        const current = this.tabs.find(t => t.id === this.activeTabId);
        if (current?.editor) {
            current.content = current.editor.getValue();
            current.viewState = current.editor.saveViewState();
        }

        this.activeTabId = id;
        const tab = this.tabs.find(t => t.id === id);
        if (!tab) return;

        this._renderTabs();
        this._initEditor(tab);
    },

    _initEditor(tab) {
        const container = document.getElementById('vs-editor-area');
        if (!container) return;
        container.innerHTML = '';

        const editorDiv = document.createElement('div');
        editorDiv.style.cssText = 'width:100%;height:100%';
        container.appendChild(editorDiv);

        const ext = tab.title.split('.').pop().toLowerCase();
        const language = this.langMap[ext] || tab.lang || 'plaintext';

        tab.editor = monaco.editor.create(editorDiv, {
            value: tab.content,
            language,
            theme: this._currentTheme || 'vs-dark',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Consolas', 'Courier New', monospace",
            minimap: { enabled: this._minimapEnabled !== false },
            wordWrap: this._wordWrap || 'off',
            automaticLayout: true,
            tabSize: 2,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
        });

        if (tab.viewState) tab.editor.restoreViewState(tab.viewState);
        tab.editor.focus();

        // Track changes
        tab.editor.onDidChangeModelContent(() => {
            tab.modified = true;
            this._renderTabs();
        });

        // Track cursor position
        tab.editor.onDidChangeCursorPosition((e) => {
            const pos = document.getElementById('vs-sb-pos');
            if (pos) pos.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
        });

        // Update statusbar language
        const langEl = document.getElementById('vs-sb-lang');
        if (langEl) langEl.textContent = language.charAt(0).toUpperCase() + language.slice(1);
    },

    closeTab(id) {
        const idx = this.tabs.findIndex(t => t.id === id);
        if (idx === -1) return;
        const tab = this.tabs[idx];
        if (tab.editor) tab.editor.dispose();
        this.tabs.splice(idx, 1);

        if (this.tabs.length === 0) {
            this.activeTabId = null;
            this._renderTabs();
            document.getElementById('vs-editor-area').innerHTML = '<div class="vs-welcome"><img src="' + ICON_PATH + '/vscode.png" alt=""><div>No open files</div></div>';
            return;
        }
        if (this.activeTabId === id) {
            const next = this.tabs[Math.min(idx, this.tabs.length - 1)];
            this._switchTab(next.id);
        } else {
            this._renderTabs();
        }
    },

    // ═══════ FILE OPS ═══════
    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js,.ts,.py,.java,.c,.cpp,.cs,.go,.rs,.php,.html,.css,.json,.xml,.md,.sql,.sh,.yml,.yaml,.txt,.toml,.dart,.kt,.rb,.swift,.lua,.bat,.env,.gitignore,.htaccess';
        input.onchange = () => {
            const file = input.files?.[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => this.newTab(file.name, e.target.result);
            reader.readAsText(file);
        };
        input.click();
    },

    saveFile() {
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (!tab?.editor) return;
        const content = tab.editor.getValue();
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = tab.title;
        a.click();
        URL.revokeObjectURL(a.href);
        tab.modified = false;
        this._renderTabs();
    },

    // ═══════ MENUS ═══════
    _toggleMenu(name, event) {
        event.stopPropagation();
        document.querySelectorAll('.vs-dropdown').forEach(d => {
            if (d.id === `vs-menu-${name}`) d.classList.toggle('show');
            else d.classList.remove('show');
        });
    },

    _closeMenus(event) {
        if (!event.target.closest('.vs-menu-item')) {
            document.querySelectorAll('.vs-dropdown').forEach(d => d.classList.remove('show'));
        }
    },

    // ═══════ EDITOR ACTIONS ═══════
    _editorAction(actionId) {
        document.querySelectorAll('.vs-dropdown').forEach(d => d.classList.remove('show'));
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (tab?.editor) tab.editor.trigger('menu', actionId);
    },

    _currentTheme: 'vs-dark',
    _minimapEnabled: true,
    _wordWrap: 'off',

    _setTheme(theme) {
        document.querySelectorAll('.vs-dropdown').forEach(d => d.classList.remove('show'));
        this._currentTheme = theme;
        monaco.editor.setTheme(theme);
    },

    _toggleSidebar() {
        document.querySelectorAll('.vs-dropdown').forEach(d => d.classList.remove('show'));
        document.getElementById('vs-sidebar')?.classList.toggle('hidden');
    },

    _toggleMinimap() {
        document.querySelectorAll('.vs-dropdown').forEach(d => d.classList.remove('show'));
        this._minimapEnabled = !this._minimapEnabled;
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (tab?.editor) tab.editor.updateOptions({ minimap: { enabled: this._minimapEnabled } });
    },

    _toggleWordWrap() {
        document.querySelectorAll('.vs-dropdown').forEach(d => d.classList.remove('show'));
        this._wordWrap = this._wordWrap === 'off' ? 'on' : 'off';
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (tab?.editor) tab.editor.updateOptions({ wordWrap: this._wordWrap });
    },

    // ═══════ KEYBOARD ═══════
    _initKeyboard() {
        this._keyHandler = (e) => {
            if (!document.getElementById('window-vscoder')) {
                document.removeEventListener('keydown', this._keyHandler);
                return;
            }
            if (!e.ctrlKey) return;
            if (e.key === 'n') { e.preventDefault(); this.newTab(); }
            if (e.key === 'o') { e.preventDefault(); this.openFile(); }
            if (e.key === 's') { e.preventDefault(); this.saveFile(); }
            if (e.key === 'b') { e.preventDefault(); this._toggleSidebar(); }
            if (e.key === 'w') { e.preventDefault(); if (this.activeTabId) this.closeTab(this.activeTabId); }
        };
        document.addEventListener('keydown', this._keyHandler);
    },
};
