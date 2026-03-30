/**
 * Code Playground — HTML/CSS/JS Live Editor with Preview
 * Based on Mini_Text_Editor (SimpleNote)
 */
Apps.CodePlayground = {
    editors: {},
    _cmLoaded: false,

    open() {
        this._loadCM().then(() => this._createWindow());
    },

    _loadCM() {
        if (this._cmLoaded) return Promise.resolve();
        const base = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/';
        const loads = [
            this._css(base + 'codemirror.min.css'),
            this._css(base + 'theme/material-darker.min.css'),
            this._js(base + 'codemirror.min.js'),
        ];
        return Promise.all(loads).then(() => Promise.all([
            this._js(base + 'mode/xml/xml.min.js'),
            this._js(base + 'mode/css/css.min.js'),
            this._js(base + 'mode/javascript/javascript.min.js'),
            this._js(base + 'mode/htmlmixed/htmlmixed.min.js'),
            this._js(base + 'addon/edit/matchbrackets.min.js'),
        ])).then(() => { this._cmLoaded = true; });
    },

    _js(url) { return new Promise(r => { if (document.querySelector(`script[src="${url}"]`)) return r(); const s = document.createElement('script'); s.src = url; s.onload = r; document.head.appendChild(s); }); },
    _css(url) { if (document.querySelector(`link[href="${url}"]`)) return Promise.resolve(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url; document.head.appendChild(l); return Promise.resolve(); },

    _createWindow() {
        XP.createWindow('codeplayground', {
            title: 'Code Playground',
            icon: 'code-playground.png',
            width: 900, height: 550,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.CodePlayground.run()"><img src="${ICON_PATH}/forward.png" style="width:16px;height:16px" alt=""> Run</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.CodePlayground.toggleEditor()">Toggle Editor</button>
            `,
            content: `
                <style>
                    .np-layout { display:flex; flex-direction:column; height:100%; margin:-8px; }
                    .np-editors { display:flex; flex:1; min-height:0; border-bottom:2px solid #d4d0c8; }
                    .np-editor-pane { flex:1; display:flex; flex-direction:column; border-right:1px solid #d4d0c8; min-width:0; }
                    .np-editor-pane:last-child { border-right:none; }
                    .np-editor-pane .np-label { background:linear-gradient(180deg,#fff,#e8e4d8); padding:2px 8px; font-size:10px; font-weight:bold; color:#003c74; border-bottom:1px solid #d4d0c8; flex-shrink:0; }
                    .np-editor-pane .CodeMirror { flex:1; font-size:12px; height:auto; }
                    .np-preview { flex:1; min-height:0; }
                    .np-preview iframe { width:100%; height:100%; border:none; background:#fff; }
                </style>
                <div class="np-layout">
                    <div class="np-editors" id="np-editors">
                        <div class="np-editor-pane"><div class="np-label">HTML</div><textarea id="np-html"></textarea></div>
                        <div class="np-editor-pane"><div class="np-label">CSS</div><textarea id="np-css"></textarea></div>
                        <div class="np-editor-pane"><div class="np-label">JavaScript</div><textarea id="np-js"></textarea></div>
                    </div>
                    <div class="np-preview"><iframe id="np-iframe"></iframe></div>
                </div>
            `,
            onReady: () => this._init(),
        });
    },

    _init() {
        const opts = { lineNumbers: true, matchBrackets: true, theme: 'material-darker', tabSize: 2 };
        this.editors.html = CodeMirror.fromTextArea(document.getElementById('np-html'), { ...opts, mode: 'htmlmixed' });
        this.editors.css = CodeMirror.fromTextArea(document.getElementById('np-css'), { ...opts, mode: 'css' });
        this.editors.js = CodeMirror.fromTextArea(document.getElementById('np-js'), { ...opts, mode: 'javascript' });

        this.editors.html.setValue('<h1>Hello XP!</h1>\n<p>Edit me and click Run</p>');
        this.editors.css.setValue('body { font-family: Tahoma; padding: 20px; }\nh1 { color: #003c74; }');
        this.editors.js.setValue('// JavaScript here\nconsole.log("Hello from Notepad!");');

        Object.values(this.editors).forEach(e => e.refresh());
        setTimeout(() => this.run(), 200);
    },

    run() {
        const iframe = document.getElementById('np-iframe');
        if (!iframe) return;
        const html = this.editors.html?.getValue() || '';
        const css = this.editors.css?.getValue() || '';
        const js = this.editors.js?.getValue() || '';
        iframe.srcdoc = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;
    },

    toggleEditor() {
        const el = document.getElementById('np-editors');
        if (el) {
            el.style.display = el.style.display === 'none' ? 'flex' : 'none';
            if (el.style.display === 'flex') Object.values(this.editors).forEach(e => e.refresh());
        }
    },
};
