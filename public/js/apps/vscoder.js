/**
 * VSCoder — Advanced Monaco Editor with Explorer, Terminal, Emmet, Git
 * Features: Multi-tab, file tree, integrated terminal, Emmet, diff tracking
 */
Apps.VSCoder = {
    _monacoLoaded: false,
    _emmetLoaded: false,
    _xtermLoaded: false,
    tabs: [],
    activeTabId: null,
    _counter: 0,
    _currentTheme: 'vs-dark',
    _minimapEnabled: true,
    _wordWrap: 'off',
    _sidebarTab: 'explorer',
    _termVisible: false,
    _term: null,
    _termCwd: '/',
    _termHistory: [],
    _termHistIdx: -1,
    _termInput: '',

    langMap: {
        js:'javascript',ts:'typescript',jsx:'javascript',tsx:'typescript',py:'python',rb:'ruby',
        java:'java',c:'c',cpp:'cpp',h:'c',cs:'csharp',go:'go',rs:'rust',php:'php',
        html:'html',htm:'html',css:'css',scss:'scss',less:'less',json:'json',xml:'xml',
        md:'markdown',sql:'sql',sh:'shell',bash:'shell',yml:'yaml',yaml:'yaml',toml:'toml',
        dart:'dart',kt:'kotlin',swift:'swift',lua:'lua',txt:'plaintext',env:'plaintext',
        vue:'html',svelte:'html',dockerfile:'dockerfile',makefile:'makefile',
    },

    langIcons: {
        javascript:'🟨',typescript:'🔷',python:'🐍',java:'☕',php:'🐘',html:'🌐',css:'🎨',
        json:'{}',markdown:'📝',sql:'🗄️',shell:'💲',yaml:'⚙️',go:'🔵',rust:'🦀',ruby:'💎',
    },

    open() {
        if (XP.windows['vscoder']) { XP.focusWindow('vscoder'); return; }
        this._loadMonaco().then(() => this._createWindow());
    },

    _js(u) { return new Promise(r => { if (document.querySelector(`script[src="${u}"]`)) return r(); const s = document.createElement('script'); s.src = u; s.onload = r; s.onerror = r; document.head.appendChild(s); }); },
    _css(u) { if (!document.querySelector(`link[href="${u}"]`)) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u; document.head.appendChild(l); } },

    _loadMonaco() {
        if (this._monacoLoaded) return Promise.resolve();
        return new Promise((resolve) => {
            const loaderScript = document.createElement('script');
            loaderScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
            loaderScript.onload = () => {
                require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
                require(['vs/editor/editor.main'], () => { this._monacoLoaded = true; resolve(); });
            };
            document.head.appendChild(loaderScript);
        });
    },

    async _loadEmmet() {
        if (this._emmetLoaded) return;
        await this._js('https://unpkg.com/emmet-monaco-es@5.4.0/dist/emmet-monaco.min.js');
        if (typeof emmetMonaco !== 'undefined') {
            emmetMonaco.emmetHTML(monaco);
            emmetMonaco.emmetCSS(monaco);
        }
        this._emmetLoaded = true;
    },

    async _loadXterm() {
        if (this._xtermLoaded) return;
        this._css('https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css');
        await this._js('https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.min.js');
        await this._js('https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.min.js');
        this._xtermLoaded = true;
    },

    _createWindow() {
        XP.createWindow('vscoder', {
            title: 'VSCoder',
            icon: 'vscode.png',
            width: 1000, height: 650,
            content: `
                <style>
                    .vs-wrap{display:flex;flex-direction:column;height:100%;margin:-8px;background:#1e1e1e;font-family:'Segoe UI',sans-serif}

                    /* Menubar */
                    .vs-menubar{display:flex;align-items:center;background:#323233;padding:0 6px;height:28px;flex-shrink:0}
                    .vs-menu-item{color:#ccc;font-size:11px;padding:4px 8px;cursor:pointer;border-radius:3px}
                    .vs-menu-item:hover{background:#505050;color:#fff}
                    .vs-menubar-title{flex:1;text-align:center;color:#888;font-size:11px}

                    /* Tabs */
                    .vs-tabbar{display:flex;align-items:center;background:#252526;min-height:32px;overflow-x:auto;flex-shrink:0}
                    .vs-tab{display:flex;align-items:center;gap:4px;padding:6px 12px;font-size:11px;color:#969696;cursor:pointer;border-right:1px solid #1e1e1e;background:#2d2d2d;white-space:nowrap}
                    .vs-tab:hover{background:#2a2d2e}
                    .vs-tab.active{background:#1e1e1e;color:#fff;border-top:2px solid #007acc;margin-top:-2px}
                    .vs-tab .vs-tab-close{font-size:14px;margin-left:6px;color:#969696;cursor:pointer;line-height:1;border-radius:3px;padding:0 2px}
                    .vs-tab .vs-tab-close:hover{color:#fff;background:#505050}
                    .vs-tab.modified .vs-tab-name::after{content:' ●';color:#c5c5c5}

                    /* Body */
                    .vs-body{display:flex;flex:1;min-height:0}

                    /* Activity bar (icon strip) */
                    .vs-actbar{width:40px;background:#333;display:flex;flex-direction:column;align-items:center;padding:4px 0;gap:2px;flex-shrink:0}
                    .vs-actbar-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:#888;font-size:18px;cursor:pointer;border-radius:4px;border-left:2px solid transparent}
                    .vs-actbar-btn:hover{color:#fff}
                    .vs-actbar-btn.active{color:#fff;border-left-color:#007acc}

                    /* Sidebar */
                    .vs-sidebar{width:240px;background:#252526;border-right:1px solid #1e1e1e;display:flex;flex-direction:column;flex-shrink:0;overflow:hidden}
                    .vs-sidebar.hidden{width:0;border:none;overflow:hidden}
                    .vs-sidebar-header{color:#bbb;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:8px 12px;font-weight:bold}

                    /* Explorer file tree */
                    .vs-tree{flex:1;overflow-y:auto;padding:0 4px;font-size:11px}
                    .vs-tree-item{display:flex;align-items:center;gap:4px;padding:2px 4px;color:#ccc;cursor:pointer;border-radius:3px;white-space:nowrap}
                    .vs-tree-item:hover{background:#2a2d2e}
                    .vs-tree-item.active{background:#094771;color:#fff}
                    .vs-tree-item .vs-tree-icon{width:14px;text-align:center;font-size:12px;flex-shrink:0}
                    .vs-tree-indent{display:inline-block}
                    .vs-tree-folder{font-weight:bold;color:#dcb67a}

                    /* Source control */
                    .vs-scm{flex:1;overflow-y:auto;padding:8px;font-size:11px}
                    .vs-scm-file{display:flex;align-items:center;gap:6px;padding:3px 6px;color:#ccc;cursor:pointer;border-radius:3px}
                    .vs-scm-file:hover{background:#2a2d2e}
                    .vs-scm-badge{font-size:9px;padding:1px 5px;border-radius:8px;font-weight:bold}
                    .vs-scm-m{background:#e2c08d;color:#000}
                    .vs-scm-a{background:#73c991;color:#000}
                    .vs-scm-discard{color:#888;cursor:pointer;margin-left:auto;font-size:13px}
                    .vs-scm-discard:hover{color:#e74c3c}

                    /* Editor */
                    .vs-editor-area{flex:1;min-width:0;display:flex;flex-direction:column}
                    .vs-editor-container{flex:1;min-height:0;position:relative}
                    .vs-welcome{display:flex;align-items:center;justify-content:center;height:100%;color:#555;font-size:12px;flex-direction:column;gap:8px}
                    .vs-welcome img{width:48px;height:48px;opacity:0.3}
                    .vs-welcome kbd{background:#333;color:#aaa;padding:2px 6px;border-radius:3px;font-size:11px;border:1px solid #444}

                    /* Terminal panel */
                    .vs-terminal{background:#1a1a1a;border-top:1px solid #007acc;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden}
                    .vs-terminal.hidden{display:none}
                    .vs-term-header{display:flex;align-items:center;background:#252526;padding:2px 8px;flex-shrink:0}
                    .vs-term-header span{color:#ccc;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:bold;flex:1}
                    .vs-term-close{color:#888;cursor:pointer;font-size:14px;padding:0 4px}
                    .vs-term-close:hover{color:#fff}
                    .vs-term-body{flex:1;min-height:0}
                    #vs-xterm{height:100%;width:100%}

                    /* Statusbar */
                    .vs-statusbar{display:flex;align-items:center;background:#007acc;color:#fff;font-size:11px;height:22px;padding:0 10px;gap:12px;flex-shrink:0;cursor:default}
                    .vs-statusbar .vs-sb-item{cursor:pointer;padding:0 4px;border-radius:2px}
                    .vs-statusbar .vs-sb-item:hover{background:rgba(255,255,255,0.15)}
                    .vs-statusbar .vs-sb-right{margin-left:auto;display:flex;gap:12px}

                    /* Menus */
                    .vs-dropdown{display:none;position:absolute;top:28px;background:#323233;border:1px solid #454545;box-shadow:0 4px 12px rgba(0,0,0,0.5);z-index:100;min-width:220px;padding:4px 0}
                    .vs-dropdown.show{display:block}
                    .vs-dd-item{padding:4px 24px;color:#ccc;font-size:11px;cursor:pointer;display:flex;justify-content:space-between}
                    .vs-dd-item:hover{background:#094771;color:#fff}
                    .vs-dd-sep{height:1px;background:#454545;margin:4px 0}
                    .vs-dd-shortcut{color:#888;font-size:10px}

                    /* Breadcrumb */
                    .vs-breadcrumb{background:#1e1e1e;padding:2px 12px;font-size:10px;color:#888;border-bottom:1px solid #333;flex-shrink:0;white-space:nowrap;overflow:hidden}
                    .vs-breadcrumb span{cursor:pointer}
                    .vs-breadcrumb span:hover{color:#ccc}
                </style>
                <div class="vs-wrap" onclick="Apps.VSCoder._closeMenus(event)">
                    <div class="vs-menubar">
                        <div class="vs-menu-item" onclick="Apps.VSCoder._toggleMenu('file',event)">File</div>
                        <div class="vs-menu-item" onclick="Apps.VSCoder._toggleMenu('edit',event)">Edit</div>
                        <div class="vs-menu-item" onclick="Apps.VSCoder._toggleMenu('view',event)">View</div>
                        <div class="vs-menu-item" onclick="Apps.VSCoder._toggleMenu('terminal',event)">Terminal</div>
                        <div class="vs-menubar-title" id="vs-title">VSCoder</div>
                    </div>

                    <!-- Dropdowns -->
                    <div class="vs-dropdown" id="vs-menu-file" style="left:6px">
                        <div class="vs-dd-item" onclick="Apps.VSCoder.newTab()">New File <span class="vs-dd-shortcut">Ctrl+N</span></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder.openFile()">Open File <span class="vs-dd-shortcut">Ctrl+O</span></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder.openFolder()">Open Folder</div>
                        <div class="vs-dd-sep"></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder.saveFile()">Save <span class="vs-dd-shortcut">Ctrl+S</span></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder.saveFileAs()">Save As...</div>
                        <div class="vs-dd-sep"></div>
                        <div class="vs-dd-item" onclick="XP.closeWindow('vscoder')">Close Window</div>
                    </div>
                    <div class="vs-dropdown" id="vs-menu-edit" style="left:40px">
                        <div class="vs-dd-item" onclick="Apps.VSCoder._editorAction('editor.action.formatDocument')">Format Document <span class="vs-dd-shortcut">Shift+Alt+F</span></div>
                        <div class="vs-dd-sep"></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._editorAction('actions.find')">Find <span class="vs-dd-shortcut">Ctrl+F</span></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._editorAction('editor.action.startFindReplaceAction')">Replace <span class="vs-dd-shortcut">Ctrl+H</span></div>
                        <div class="vs-dd-sep"></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._editorAction('editor.action.addSelectionToNextFindMatch')">Add Next Occurrence <span class="vs-dd-shortcut">Ctrl+D</span></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._editorAction('editor.action.selectHighlights')">Select All Occurrences <span class="vs-dd-shortcut">Ctrl+Shift+L</span></div>
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
                    <div class="vs-dropdown" id="vs-menu-terminal" style="left:115px">
                        <div class="vs-dd-item" onclick="Apps.VSCoder.toggleTerminal()">Toggle Terminal <span class="vs-dd-shortcut">Ctrl+\`</span></div>
                        <div class="vs-dd-item" onclick="Apps.VSCoder._termClear()">Clear Terminal</div>
                    </div>

                    <div class="vs-tabbar" id="vs-tabbar"></div>
                    <div class="vs-breadcrumb" id="vs-breadcrumb"></div>
                    <div class="vs-body">
                        <div class="vs-actbar">
                            <div class="vs-actbar-btn active" title="Explorer" onclick="Apps.VSCoder._setSidebarTab('explorer')">&#128193;</div>
                            <div class="vs-actbar-btn" title="Source Control" onclick="Apps.VSCoder._setSidebarTab('scm')">&#9432;</div>
                            <div class="vs-actbar-btn" title="Search" onclick="Apps.VSCoder._setSidebarTab('search')">&#128269;</div>
                        </div>
                        <div class="vs-sidebar" id="vs-sidebar">
                            <div id="vs-sidebar-content"></div>
                        </div>
                        <div class="vs-editor-area">
                            <div class="vs-editor-container" id="vs-editor-area">
                                <div class="vs-welcome">
                                    <img src="${ICON_PATH}/vscode.png" alt="">
                                    <div><kbd>Ctrl+N</kbd> New File &nbsp; <kbd>Ctrl+O</kbd> Open File</div>
                                    <div><kbd>Ctrl+\`</kbd> Terminal &nbsp; <kbd>Ctrl+B</kbd> Sidebar</div>
                                    <div style="color:#444;margin-top:8px;font-size:10px">Emmet • Multi-cursor • Minimap • Diff Tracking</div>
                                </div>
                            </div>
                            <div class="vs-terminal hidden" id="vs-terminal" style="height:180px">
                                <div class="vs-term-header">
                                    <span>Terminal</span>
                                    <span class="vs-term-close" onclick="Apps.VSCoder.toggleTerminal()">✕</span>
                                </div>
                                <div class="vs-term-body" id="vs-xterm"></div>
                            </div>
                        </div>
                    </div>
                    <div class="vs-statusbar">
                        <span class="vs-sb-item" onclick="Apps.VSCoder._setSidebarTab('scm')" id="vs-sb-branch">⎇ main</span>
                        <span class="vs-sb-item" id="vs-sb-errors">✓ 0</span>
                        <span class="vs-sb-right">
                            <span class="vs-sb-item" id="vs-sb-pos">Ln 1, Col 1</span>
                            <span class="vs-sb-item" id="vs-sb-indent">Spaces: 2</span>
                            <span class="vs-sb-item" id="vs-sb-encoding">UTF-8</span>
                            <span class="vs-sb-item" id="vs-sb-lang" onclick="Apps.VSCoder._showLangPicker()">Plain Text</span>
                        </span>
                    </div>
                </div>
            `,
            onReady: () => {
                this.tabs = [];
                this._counter = 0;
                this._initKeyboard();
                this._setSidebarTab('explorer');
                this._loadEmmet();
            },
            onClose: () => { this.tabs = []; this.activeTabId = null; this._term = null; },
        });
    },

    // ═══════ TABS ═══════
    newTab(title, content, lang) {
        const id = ++this._counter;
        const tab = {
            id, title: title || `untitled-${id}.js`, content: content || '',
            originalContent: content || '', lang: lang || null,
            modified: false, editor: null, viewState: null,
        };
        this.tabs.push(tab);
        this._renderTabs();
        this._switchTab(id);
    },

    _renderTabs() {
        const bar = document.getElementById('vs-tabbar');
        if (!bar) return;
        bar.innerHTML = this.tabs.map(t => {
            const ext = t.title.split('.').pop().toLowerCase();
            const lang = this.langMap[ext] || 'plaintext';
            const icon = this.langIcons[lang] || '📄';
            return `<div class="vs-tab ${t.id === this.activeTabId ? 'active' : ''} ${t.modified ? 'modified' : ''}" onclick="Apps.VSCoder._switchTab(${t.id})">
                <span style="font-size:12px">${icon}</span>
                <span class="vs-tab-name">${esc(t.title)}</span>
                <span class="vs-tab-close" onclick="event.stopPropagation();Apps.VSCoder.closeTab(${t.id})">×</span>
            </div>`;
        }).join('');
        this._updateSCM();
        this._renderExplorer();
    },

    _switchTab(id) {
        const current = this.tabs.find(t => t.id === this.activeTabId);
        if (current?.editor) { current.content = current.editor.getValue(); current.viewState = current.editor.saveViewState(); }

        this.activeTabId = id;
        const tab = this.tabs.find(t => t.id === id);
        if (!tab) return;

        this._renderTabs();
        this._initEditor(tab);

        // Breadcrumb
        const bc = document.getElementById('vs-breadcrumb');
        if (bc) bc.innerHTML = `<span>${esc(tab.title)}</span>`;
        // Title
        const tt = document.getElementById('vs-title');
        if (tt) tt.textContent = tab.title + ' — VSCoder';
    },

    _initEditor(tab) {
        const container = document.getElementById('vs-editor-area');
        if (!container) return;
        container.innerHTML = '';

        const editorDiv = document.createElement('div');
        editorDiv.style.cssText = 'width:100%;height:100%';
        container.appendChild(editorDiv);

        const ext = tab.title.split('.').pop().toLowerCase();
        const language = tab.lang || this.langMap[ext] || 'plaintext';

        tab.editor = monaco.editor.create(editorDiv, {
            value: tab.content,
            language,
            theme: this._currentTheme,
            fontSize: 13,
            fontFamily: "'JetBrains Mono','Consolas','Courier New',monospace",
            fontLigatures: true,
            minimap: { enabled: this._minimapEnabled },
            wordWrap: this._wordWrap,
            automaticLayout: true,
            tabSize: 2,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
            stickyScroll: { enabled: true },
            linkedEditing: true,
            suggest: { showWords: true },
        });

        if (tab.viewState) tab.editor.restoreViewState(tab.viewState);
        tab.editor.focus();

        tab.editor.onDidChangeModelContent(() => {
            tab.modified = tab.editor.getValue() !== tab.originalContent;
            this._renderTabs();
        });

        tab.editor.onDidChangeCursorPosition((e) => {
            const pos = document.getElementById('vs-sb-pos');
            if (pos) pos.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
        });

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
            document.getElementById('vs-editor-area').innerHTML = '<div class="vs-welcome"><img src="'+ICON_PATH+'/vscode.png" alt=""><div>No open files</div></div>';
            document.getElementById('vs-breadcrumb').innerHTML = '';
            document.getElementById('vs-title').textContent = 'VSCoder';
            return;
        }
        if (this.activeTabId === id) {
            this._switchTab(this.tabs[Math.min(idx, this.tabs.length - 1)].id);
        } else { this._renderTabs(); }
    },

    // ═══════ FILE OPS ═══════
    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.cs,.go,.rs,.php,.html,.htm,.css,.scss,.less,.json,.xml,.md,.sql,.sh,.yml,.yaml,.txt,.toml,.dart,.kt,.rb,.swift,.lua,.bat,.env,.vue,.svelte,.gitignore,.htaccess,.dockerfile,.makefile';
        input.onchange = () => {
            Array.from(input.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => this.newTab(file.name, e.target.result);
                reader.readAsText(file);
            });
        };
        input.click();
    },

    openFolder() {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = () => {
            const files = Array.from(input.files).filter(f => !f.name.startsWith('.') && f.size < 500000);
            // Build tree structure
            this._folderFiles = files;
            this._folderName = files[0]?.webkitRelativePath?.split('/')[0] || 'Project';
            this._renderExplorer();
            // Auto-open first text file
            const first = files.find(f => this._isTextFile(f.name));
            if (first) this._openFolderFile(first);
        };
        input.click();
    },

    _folderFiles: [],
    _folderName: '',
    _expandedDirs: new Set(),

    _isTextFile(name) {
        const ext = name.split('.').pop().toLowerCase();
        return !!this.langMap[ext] || ['log','conf','cfg','ini','editorconfig','gitignore','htaccess','env','lock'].includes(ext);
    },

    _openFolderFile(file) {
        // Check if already open
        const existing = this.tabs.find(t => t.title === file.name && t._path === file.webkitRelativePath);
        if (existing) { this._switchTab(existing.id); return; }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.newTab(file.name, e.target.result);
            this.tabs[this.tabs.length - 1]._path = file.webkitRelativePath;
        };
        reader.readAsText(file);
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
        tab.originalContent = content;
        this._renderTabs();
    },

    saveFileAs() {
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (!tab?.editor) return;
        const name = prompt('Save as:', tab.title);
        if (!name) return;
        tab.title = name;
        this.saveFile();
    },

    // ═══════ SIDEBAR ═══════
    _setSidebarTab(tab) {
        this._sidebarTab = tab;
        document.querySelectorAll('.vs-actbar-btn').forEach((b, i) => {
            b.classList.toggle('active', ['explorer','scm','search'][i] === tab);
        });
        const sidebar = document.getElementById('vs-sidebar');
        sidebar?.classList.remove('hidden');
        if (tab === 'explorer') this._renderExplorer();
        else if (tab === 'scm') this._renderSCM();
        else if (tab === 'search') this._renderSearch();
    },

    _renderExplorer() {
        const el = document.getElementById('vs-sidebar-content');
        if (!el || this._sidebarTab !== 'explorer') return;

        let html = '<div class="vs-sidebar-header">Explorer</div>';

        // Folder tree
        if (this._folderFiles.length > 0) {
            html += `<div style="padding:4px 8px;font-size:10px;color:#888;text-transform:uppercase;font-weight:bold">${esc(this._folderName)}</div>`;
            html += '<div class="vs-tree">';
            html += this._buildFileTree();
            html += '</div>';
        }

        // Open files section
        html += '<div class="vs-sidebar-header" style="margin-top:8px;border-top:1px solid #333;padding-top:8px">Open Files</div>';
        html += '<div class="vs-tree">';
        if (this.tabs.length === 0) {
            html += '<div style="padding:8px 12px;color:#666;font-size:11px">No open files</div>';
        } else {
            html += this.tabs.map(t => {
                const ext = t.title.split('.').pop().toLowerCase();
                const lang = this.langMap[ext] || 'plaintext';
                const icon = this.langIcons[lang] || '📄';
                return `<div class="vs-tree-item ${t.id === this.activeTabId ? 'active' : ''}" onclick="Apps.VSCoder._switchTab(${t.id})">
                    <span class="vs-tree-icon">${icon}</span>
                    ${esc(t.title)}${t.modified ? ' <span style="color:#c5c5c5">●</span>' : ''}
                </div>`;
            }).join('');
        }
        html += '</div>';
        el.innerHTML = html;
    },

    _buildFileTree() {
        const tree = {};
        this._folderFiles.forEach(f => {
            const parts = f.webkitRelativePath.split('/').slice(1); // skip root folder name
            let node = tree;
            parts.forEach((p, i) => {
                if (i === parts.length - 1) {
                    if (!node._files) node._files = [];
                    node._files.push({ name: p, file: f });
                } else {
                    if (!node[p]) node[p] = {};
                    node = node[p];
                }
            });
        });
        return this._renderTreeNode(tree, 0, '');
    },

    _renderTreeNode(node, depth, path) {
        let html = '';
        const indent = `<span class="vs-tree-indent" style="width:${depth * 12}px"></span>`;

        // Folders first
        const dirs = Object.keys(node).filter(k => k !== '_files').sort();
        dirs.forEach(dir => {
            const fullPath = path + '/' + dir;
            const expanded = this._expandedDirs.has(fullPath);
            html += `<div class="vs-tree-item vs-tree-folder" onclick="Apps.VSCoder._toggleDir('${fullPath}')">
                ${indent}<span class="vs-tree-icon">${expanded ? '📂' : '📁'}</span>${esc(dir)}
            </div>`;
            if (expanded) html += this._renderTreeNode(node[dir], depth + 1, fullPath);
        });

        // Files
        if (node._files) {
            node._files.sort((a, b) => a.name.localeCompare(b.name)).forEach(f => {
                const ext = f.name.split('.').pop().toLowerCase();
                const lang = this.langMap[ext] || 'plaintext';
                const icon = this.langIcons[lang] || '📄';
                html += `<div class="vs-tree-item" onclick="Apps.VSCoder._openFolderFile(Apps.VSCoder._folderFiles.find(x=>x.webkitRelativePath==='${f.file.webkitRelativePath.replace(/'/g, "\\'")}'))">
                    ${indent}<span class="vs-tree-icon">${icon}</span>${esc(f.name)}
                </div>`;
            });
        }
        return html;
    },

    _toggleDir(path) {
        if (this._expandedDirs.has(path)) this._expandedDirs.delete(path);
        else this._expandedDirs.add(path);
        this._renderExplorer();
    },

    // ═══════ SOURCE CONTROL ═══════
    _renderSCM() {
        const el = document.getElementById('vs-sidebar-content');
        if (!el) return;
        const modified = this.tabs.filter(t => t.modified);
        let html = '<div class="vs-sidebar-header">Source Control</div>';
        html += `<div style="padding:4px 12px;font-size:10px;color:#888">${modified.length} file${modified.length !== 1 ? 's' : ''} changed</div>`;
        html += '<div class="vs-scm">';
        if (modified.length === 0) {
            html += '<div style="padding:12px;color:#666;text-align:center;font-size:11px">No changes detected</div>';
        } else {
            modified.forEach(t => {
                html += `<div class="vs-scm-file" onclick="Apps.VSCoder._switchTab(${t.id})">
                    <span class="vs-scm-badge vs-scm-m">M</span>
                    <span>${esc(t.title)}</span>
                    <span class="vs-scm-discard" onclick="event.stopPropagation();Apps.VSCoder._discardChanges(${t.id})" title="Discard changes">↩</span>
                </div>`;
            });
        }
        html += '</div>';
        el.innerHTML = html;
    },

    _updateSCM() {
        const modified = this.tabs.filter(t => t.modified);
        const sb = document.getElementById('vs-sb-errors');
        if (sb) sb.textContent = modified.length > 0 ? `● ${modified.length} modified` : '✓ 0';
        if (this._sidebarTab === 'scm') this._renderSCM();
    },

    _discardChanges(id) {
        const tab = this.tabs.find(t => t.id === id);
        if (!tab) return;
        tab.content = tab.originalContent;
        tab.modified = false;
        if (tab.editor) tab.editor.setValue(tab.originalContent);
        this._renderTabs();
    },

    // ═══════ SEARCH ═══════
    _renderSearch() {
        const el = document.getElementById('vs-sidebar-content');
        if (!el) return;
        el.innerHTML = `
            <div class="vs-sidebar-header">Search</div>
            <div style="padding:4px 8px">
                <input class="xp-input" id="vs-search-q" placeholder="Search across files..." style="width:100%;background:#3c3c3c;color:#ccc;border:1px solid #555;font-size:11px;padding:4px" onkeydown="if(event.key==='Enter')Apps.VSCoder._doGlobalSearch()">
                <div id="vs-search-results" style="margin-top:8px;font-size:11px"></div>
            </div>`;
    },

    _doGlobalSearch() {
        const q = document.getElementById('vs-search-q')?.value?.toLowerCase();
        if (!q) return;
        const results = document.getElementById('vs-search-results');
        let html = '';
        this.tabs.forEach(t => {
            const content = t.editor ? t.editor.getValue() : t.content;
            const lines = content.split('\n');
            const matches = [];
            lines.forEach((line, i) => {
                if (line.toLowerCase().includes(q)) matches.push({ line: i + 1, text: line.trim().substring(0, 80) });
            });
            if (matches.length > 0) {
                html += `<div style="color:#dcb67a;padding:4px 0;font-weight:bold">${esc(t.title)} (${matches.length})</div>`;
                matches.slice(0, 10).forEach(m => {
                    html += `<div class="vs-tree-item" onclick="Apps.VSCoder._switchTab(${t.id});Apps.VSCoder._goToLine(${m.line})" style="font-size:10px"><span style="color:#888;width:30px;display:inline-block">${m.line}</span>${esc(m.text)}</div>`;
                });
            }
        });
        results.innerHTML = html || '<div style="color:#888;padding:8px">No results</div>';
    },

    _goToLine(line) {
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (tab?.editor) { tab.editor.revealLineInCenter(line); tab.editor.setPosition({ lineNumber: line, column: 1 }); tab.editor.focus(); }
    },

    // ═══════ TERMINAL ═══════
    async toggleTerminal() {
        this._closeMenus({target:document.body});
        const panel = document.getElementById('vs-terminal');
        if (!panel) return;
        this._termVisible = !this._termVisible;
        panel.classList.toggle('hidden', !this._termVisible);
        if (this._termVisible && !this._term) {
            await this._loadXterm();
            this._initTerminal();
        }
        if (this._termVisible && this._term) this._term.focus();
    },

    _initTerminal() {
        if (!window.Terminal) return;
        const container = document.getElementById('vs-xterm');
        if (!container) return;

        this._term = new Terminal({ theme: { background: '#1a1a1a', foreground: '#cccccc', cursor: '#007acc' }, fontSize: 12, fontFamily: "'Consolas','Courier New',monospace", cursorBlink: true });
        const fitAddon = new FitAddon.FitAddon();
        this._term.loadAddon(fitAddon);
        this._term.open(container);
        fitAddon.fit();

        this._termWriteLn('\x1b[36mVSCoder Terminal v1.0\x1b[0m');
        this._termWriteLn('Type \x1b[33mhelp\x1b[0m for available commands.\n');
        this._termPrompt();

        this._termInput = '';
        this._term.onKey(({ key, domEvent }) => {
            if (domEvent.key === 'Enter') {
                this._term.write('\r\n');
                this._termExec(this._termInput.trim());
                this._termInput = '';
            } else if (domEvent.key === 'Backspace') {
                if (this._termInput.length > 0) {
                    this._termInput = this._termInput.slice(0, -1);
                    this._term.write('\b \b');
                }
            } else if (domEvent.key === 'ArrowUp') {
                // History
                if (this._termHistory.length > 0 && this._termHistIdx > 0) {
                    this._termHistIdx--;
                    this._termReplaceInput(this._termHistory[this._termHistIdx]);
                }
            } else if (domEvent.key === 'ArrowDown') {
                if (this._termHistIdx < this._termHistory.length - 1) {
                    this._termHistIdx++;
                    this._termReplaceInput(this._termHistory[this._termHistIdx]);
                }
            } else if (key.length === 1 && !domEvent.ctrlKey && !domEvent.altKey) {
                this._termInput += key;
                this._term.write(key);
            }
        });
    },

    _termPrompt() { this._term?.write('\x1b[32m❯\x1b[0m '); },
    _termWriteLn(text) { this._term?.writeln(text); },

    _termReplaceInput(val) {
        // Clear current input and replace
        const clearLen = this._termInput.length;
        this._term.write('\b \b'.repeat(clearLen));
        this._termInput = val;
        this._term.write(val);
    },

    _termExec(cmd) {
        if (cmd) { this._termHistory.push(cmd); this._termHistIdx = this._termHistory.length; }
        const parts = cmd.split(/\s+/);
        const command = parts[0]?.toLowerCase();
        const args = parts.slice(1).join(' ');

        switch (command) {
            case '': break;
            case 'help':
                this._termWriteLn('\x1b[33mAvailable commands:\x1b[0m');
                this._termWriteLn('  help              Show this help');
                this._termWriteLn('  clear             Clear terminal');
                this._termWriteLn('  echo <text>       Print text');
                this._termWriteLn('  date              Current date/time');
                this._termWriteLn('  ls                List open files');
                this._termWriteLn('  cat <filename>    Show file contents');
                this._termWriteLn('  wc <filename>     Word/line count');
                this._termWriteLn('  eval <js>         Execute JavaScript');
                this._termWriteLn('  new <filename>    Create new file');
                this._termWriteLn('  theme <name>      Set theme (vs-dark, vs, hc-black)');
                break;
            case 'clear': this._term.clear(); break;
            case 'echo': this._termWriteLn(args); break;
            case 'date': this._termWriteLn(new Date().toString()); break;
            case 'ls':
                if (this.tabs.length === 0) this._termWriteLn('\x1b[90m(no open files)\x1b[0m');
                else this.tabs.forEach(t => this._termWriteLn(`${t.modified ? '\x1b[33m●\x1b[0m' : ' '} ${t.title}`));
                break;
            case 'cat': {
                const tab = this.tabs.find(t => t.title === args);
                if (!tab) { this._termWriteLn(`\x1b[31mFile not found: ${args}\x1b[0m`); break; }
                const content = tab.editor ? tab.editor.getValue() : tab.content;
                content.split('\n').forEach(line => this._termWriteLn(line));
                break;
            }
            case 'wc': {
                const tab = this.tabs.find(t => t.title === args);
                if (!tab) { this._termWriteLn(`\x1b[31mFile not found: ${args}\x1b[0m`); break; }
                const c = tab.editor ? tab.editor.getValue() : tab.content;
                const lines = c.split('\n').length;
                const words = c.split(/\s+/).filter(Boolean).length;
                const chars = c.length;
                this._termWriteLn(`  ${lines} lines, ${words} words, ${chars} chars`);
                break;
            }
            case 'eval': case 'node':
                try {
                    const expr = args.replace(/^-e\s+/, '');
                    const result = eval(expr);
                    this._termWriteLn(String(result));
                } catch (e) { this._termWriteLn(`\x1b[31m${e.message}\x1b[0m`); }
                break;
            case 'new':
                if (!args) { this._termWriteLn('\x1b[31mUsage: new <filename>\x1b[0m'); break; }
                this.newTab(args, '');
                this._termWriteLn(`Created: ${args}`);
                break;
            case 'theme':
                if (['vs-dark','vs','hc-black'].includes(args)) { this._setTheme(args); this._termWriteLn(`Theme set to: ${args}`); }
                else this._termWriteLn('\x1b[31mThemes: vs-dark, vs, hc-black\x1b[0m');
                break;
            default:
                this._termWriteLn(`\x1b[31mCommand not found: ${command}\x1b[0m. Type \x1b[33mhelp\x1b[0m for commands.`);
        }
        this._termPrompt();
    },

    _termClear() {
        this._closeMenus({target:document.body});
        if (this._term) this._term.clear();
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
        if (!event.target.closest('.vs-menu-item'))
            document.querySelectorAll('.vs-dropdown').forEach(d => d.classList.remove('show'));
    },

    // ═══════ EDITOR ACTIONS ═══════
    _editorAction(actionId) {
        this._closeMenus({target:document.body});
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (tab?.editor) tab.editor.trigger('menu', actionId);
    },

    _setTheme(theme) {
        this._closeMenus({target:document.body});
        this._currentTheme = theme;
        monaco.editor.setTheme(theme);
        const sb = document.querySelector('.vs-statusbar');
        if (sb) sb.style.background = theme === 'vs' ? '#1177bb' : theme === 'hc-black' ? '#000' : '#007acc';
    },

    _toggleSidebar() {
        this._closeMenus({target:document.body});
        document.getElementById('vs-sidebar')?.classList.toggle('hidden');
    },
    _toggleMinimap() {
        this._closeMenus({target:document.body});
        this._minimapEnabled = !this._minimapEnabled;
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (tab?.editor) tab.editor.updateOptions({ minimap: { enabled: this._minimapEnabled } });
    },
    _toggleWordWrap() {
        this._closeMenus({target:document.body});
        this._wordWrap = this._wordWrap === 'off' ? 'on' : 'off';
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (tab?.editor) tab.editor.updateOptions({ wordWrap: this._wordWrap });
    },
    _showLangPicker() {
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (!tab?.editor) return;
        const lang = prompt('Language mode:', tab.editor.getModel()?.getLanguageId() || 'plaintext');
        if (lang) { monaco.editor.setModelLanguage(tab.editor.getModel(), lang); document.getElementById('vs-sb-lang').textContent = lang; }
    },

    // ═══════ KEYBOARD ═══════
    _initKeyboard() {
        this._keyHandler = (e) => {
            if (!document.getElementById('window-vscoder')) { document.removeEventListener('keydown', this._keyHandler); return; }
            if (e.ctrlKey && e.key === 'n') { e.preventDefault(); this.newTab(); }
            if (e.ctrlKey && e.key === 'o') { e.preventDefault(); this.openFile(); }
            if (e.ctrlKey && e.key === 's') { e.preventDefault(); this.saveFile(); }
            if (e.ctrlKey && e.key === 'b') { e.preventDefault(); this._toggleSidebar(); }
            if (e.ctrlKey && e.key === 'w') { e.preventDefault(); if (this.activeTabId) this.closeTab(this.activeTabId); }
            if (e.ctrlKey && e.key === '`') { e.preventDefault(); this.toggleTerminal(); }
        };
        document.addEventListener('keydown', this._keyHandler);
    },
};
