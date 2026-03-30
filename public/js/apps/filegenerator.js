/**
 * File Generator App — Code Editor with 28+ language support
 * Based on File_Generator project
 */
Apps.FileGenerator = {
    editor: null,
    _cmLoaded: false,

    fileTypes: [
        ['txt','Plain Text','txt.png'],['md','Markdown','Markdown.png'],['html','HTML','html5.png'],['css','CSS','css3.png'],['js','JavaScript','js.png'],
        ['ts','TypeScript','typescript.png'],['json','JSON','json.png'],['xml','XML','xml.png'],['sql','SQL','sql.png'],['py','Python','Python.png'],
        ['java','Java','java.png'],['kt','Kotlin','kotlin.png'],['c','C','c.png'],['cpp','C++','cpp.png'],['cs','C#','csharp.png'],['php','PHP','php.png'],
        ['rb','Ruby','Ruby.png'],['swift','Swift','swift.png'],['dart','Dart','dart.png'],['go','Go','go.png'],['rs','Rust','rush.png'],
        ['lua','Lua','lua.png'],['sh','Shell','sh.png'],['bat','Batch','bat.png'],['yml','YAML','yml.png'],['toml','TOML','toml.png'],
    ],

    iconPath: null,

    modeMap: {
        txt:'text/plain', md:'text/x-markdown', html:'htmlmixed', css:'css', js:'javascript',
        ts:'javascript', json:'application/json', xml:'xml', sql:'sql', py:'python',
        java:'text/x-java', kt:'text/x-kotlin', c:'text/x-csrc', cpp:'text/x-c++src',
        cs:'text/x-csharp', php:'application/x-httpd-php', rb:'text/x-ruby', swift:'text/x-swift',
        dart:'dart', go:'go', rs:'text/x-rustsrc', lua:'text/x-lua', sh:'shell',
        bat:'text/plain', yml:'yaml', toml:'toml',
    },

    open() {
        this._loadCM().then(() => this._createWindow());
    },

    _loadCM() {
        if (this._cmLoaded) return Promise.resolve();
        const base = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/';
        return Promise.all([
            this._css(base + 'codemirror.min.css'),
            this._css(base + 'theme/material-darker.min.css'),
            this._js(base + 'codemirror.min.js'),
        ]).then(() => Promise.all([
            this._js(base + 'addon/edit/matchbrackets.min.js'),
            this._js(base + 'addon/selection/active-line.min.js'),
            this._js(base + 'addon/mode/loadmode.min.js'),
            this._js(base + 'mode/meta.min.js'),
        ])).then(() => {
            CodeMirror.modeURL = base + 'mode/%N/%N.min.js';
            this._cmLoaded = true;
        });
    },

    _js(u){return new Promise(r=>{if(document.querySelector(`script[src="${u}"]`))return r();const s=document.createElement('script');s.src=u;s.onload=r;document.head.appendChild(s);});},
    _css(u){if(document.querySelector(`link[href="${u}"]`))return Promise.resolve();const l=document.createElement('link');l.rel='stylesheet';l.href=u;document.head.appendChild(l);return Promise.resolve();},

    _createWindow() {
        this.iconPath = ICON_PATH + '/filetypes/';
        const typeOpts = this.fileTypes.map(([ext, name, icon]) =>
            `<option value="${ext}" data-icon="${icon}">${name} (.${ext})</option>`
        ).join('');
        XP.createWindow('filegenerator', {
            title: 'File Generator',
            icon: 'file-generator.png',
            width: 750, height: 520,
            toolbar: `
                <img id="fg-type-icon" src="${ICON_PATH}/filetypes/txt.png" style="width:16px;height:16px;margin-right:2px" alt="">
                <select class="xp-select" id="fg-type" onchange="Apps.FileGenerator.changeType(this.value)" style="width:160px">${typeOpts}</select>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.FileGenerator.openFile()"><img src="${ICON_PATH}/folder-opened.png" style="width:16px;height:16px" alt=""> Open</button>
                <button class="toolbar-btn" onclick="Apps.FileGenerator.downloadFile()"><img src="${ICON_PATH}/save.png" style="width:16px;height:16px" alt="" onerror="this.style.display='none'"> Save</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.FileGenerator.copyAll()">Copy All</button>
            `,
            statusbar: '<span class="statusbar-section" id="fg-status">Ready</span>',
            content: `
                <style>
                    #fg-editor-wrap { height:100%; margin:-8px; }
                    #fg-editor-wrap .CodeMirror { height:100%; font-size:13px; }
                </style>
                <div id="fg-editor-wrap"><textarea id="fg-editor"></textarea></div>
                <input type="file" id="fg-file-input" style="display:none" onchange="Apps.FileGenerator.handleOpen(this)">
            `,
            onReady: () => this._init(),
        });
    },

    _init() {
        this.editor = CodeMirror.fromTextArea(document.getElementById('fg-editor'), {
            lineNumbers: true, matchBrackets: true, styleActiveLine: true,
            theme: 'material-darker', tabSize: 2, mode: 'text/plain',
        });
        this.editor.setValue('// Start typing or open a file...\n');
        this.editor.on('change', () => this._updateStatus());
        this._updateStatus();
    },

    changeType(ext) {
        const mode = this.modeMap[ext] || 'text/plain';
        if (CodeMirror.autoLoadMode) CodeMirror.autoLoadMode(this.editor, mode);
        this.editor.setOption('mode', mode);
        // Update icon next to dropdown
        const sel = document.getElementById('fg-type');
        const opt = sel?.selectedOptions?.[0];
        const iconFile = opt?.dataset?.icon || 'txt.png';
        const iconEl = document.getElementById('fg-type-icon');
        if (iconEl) iconEl.src = this.iconPath + iconFile;
        this._updateStatus();
    },

    _updateStatus() {
        const s = document.getElementById('fg-status');
        if (s && this.editor) {
            const lines = this.editor.lineCount();
            const ext = document.getElementById('fg-type')?.value || 'txt';
            s.textContent = `${lines} lines | .${ext}`;
        }
    },

    openFile() {
        document.getElementById('fg-file-input')?.click();
    },

    handleOpen(input) {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.editor.setValue(e.target.result);
            // Auto-detect type
            const ext = file.name.split('.').pop().toLowerCase();
            const sel = document.getElementById('fg-type');
            if (sel) {
                const opt = [...sel.options].find(o => o.value === ext);
                if (opt) { sel.value = ext; this.changeType(ext); }
            }
            XP.notify('Opened', file.name);
        };
        reader.readAsText(file);
        input.value = '';
    },

    downloadFile() {
        const content = this.editor?.getValue() || '';
        const ext = document.getElementById('fg-type')?.value || 'txt';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `file.${ext}`; a.click();
        URL.revokeObjectURL(url);
        XP.notify('Downloaded', `file.${ext}`);
    },

    copyAll() {
        const text = this.editor?.getValue() || '';
        navigator.clipboard.writeText(text);
        XP.notify('Copied', 'Content copied to clipboard');
    },
};
