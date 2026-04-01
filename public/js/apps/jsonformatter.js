/**
 * JSON Formatter — Format, validate, minify, and inspect JSON
 */
Apps.JSONFormatter = {
    open() {
        if (XP.windows['jsonformatter']) { XP.focusWindow('jsonformatter'); return; }

        XP.createWindow('jsonformatter', {
            title: 'JSON Formatter',
            icon: 'java-script.png',
            width: 750, height: 520,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.JSONFormatter.format()"><img src="${ICON_PATH}/properties.png" style="width:16px;height:16px" alt=""> Format</button>
                <button class="toolbar-btn" onclick="Apps.JSONFormatter.minify()"><img src="${ICON_PATH}/attributes.png" style="width:16px;height:16px" alt=""> Minify</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.JSONFormatter.treeView()"><img src="${ICON_PATH}/graph-view.png" style="width:16px;height:16px" alt=""> Tree</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.JSONFormatter.copyOutput()"><img src="${ICON_PATH}/copy.png" style="width:16px;height:16px" alt=""> Copy</button>
                <button class="toolbar-btn" onclick="Apps.JSONFormatter.clear()"><img src="${ICON_PATH}/erase.png" style="width:16px;height:16px" alt=""> Clear</button>
            `,
            statusbar: '<span id="jf-status">Paste JSON and click Format</span>',
            content: `
                <style>
                    .jf-wrap { display:flex; height:100%; gap:0; }
                    .jf-panel { flex:1; display:flex; flex-direction:column; }
                    .jf-panel-label { font-size:10px; font-weight:bold; color:#666; padding:3px 6px; background:#ece9d8; border-bottom:1px solid #d4d0c8; }
                    .jf-input, .jf-output { flex:1; width:100%; border:none; resize:none; padding:6px; font-family:Consolas,'Courier New',monospace; font-size:12px; outline:none; }
                    .jf-input { border-right:2px solid #d4d0c8; }
                    .jf-output { background:#fafafa; }
                    .jf-tree { flex:1; overflow:auto; padding:6px; font-family:Consolas,monospace; font-size:12px; background:#fafafa; }
                    .jf-key { color:#881391; }
                    .jf-str { color:#1a1aa6; }
                    .jf-num { color:#098658; }
                    .jf-bool { color:#0451a5; }
                    .jf-null { color:#999; }
                    .jf-toggle { cursor:pointer; user-select:none; }
                    .jf-toggle::before { content:'\\25BC'; display:inline-block; width:14px; font-size:9px; color:#888; }
                    .jf-toggle.collapsed::before { content:'\\25B6'; }
                    .jf-children { margin-left:18px; }
                    .jf-children.hidden { display:none; }
                    .jf-error { color:#c00; padding:10px; }
                    .jf-count { color:#999; font-size:10px; }
                </style>
                <div class="jf-wrap">
                    <div class="jf-panel">
                        <div class="jf-panel-label">Input</div>
                        <textarea class="jf-input" id="jf-input" placeholder="Paste your JSON here..." spellcheck="false"></textarea>
                    </div>
                    <div class="jf-panel">
                        <div class="jf-panel-label">Output</div>
                        <textarea class="jf-output" id="jf-output" readonly spellcheck="false"></textarea>
                        <div class="jf-tree" id="jf-tree" style="display:none"></div>
                    </div>
                </div>
            `,
        });
    },

    _parse() {
        const input = document.getElementById('jf-input')?.value?.trim();
        const status = document.getElementById('jf-status');
        if (!input) { status.textContent = 'Input is empty'; return null; }
        try {
            const obj = JSON.parse(input);
            return obj;
        } catch (e) {
            status.textContent = 'Invalid JSON: ' + e.message;
            document.getElementById('jf-output').value = '';
            return null;
        }
    },

    format() {
        const obj = this._parse();
        if (obj === null) return;
        const out = JSON.stringify(obj, null, 2);
        document.getElementById('jf-output').value = out;
        document.getElementById('jf-output').style.display = '';
        document.getElementById('jf-tree').style.display = 'none';
        const status = document.getElementById('jf-status');
        status.textContent = `Valid JSON — ${this._countKeys(obj)} keys, ${out.length} chars`;
    },

    minify() {
        const obj = this._parse();
        if (obj === null) return;
        const out = JSON.stringify(obj);
        document.getElementById('jf-output').value = out;
        document.getElementById('jf-output').style.display = '';
        document.getElementById('jf-tree').style.display = 'none';
        document.getElementById('jf-status').textContent = `Minified — ${out.length} chars`;
    },

    treeView() {
        const obj = this._parse();
        if (obj === null) return;
        const tree = document.getElementById('jf-tree');
        const output = document.getElementById('jf-output');
        output.style.display = 'none';
        tree.style.display = '';
        tree.innerHTML = this._renderNode(obj);
        document.getElementById('jf-status').textContent = `Tree view — ${this._countKeys(obj)} keys`;
    },

    _renderNode(val, key) {
        if (val === null) return `<span class="jf-null">null</span>`;
        if (typeof val === 'string') return `<span class="jf-str">"${this._esc(val)}"</span>`;
        if (typeof val === 'number') return `<span class="jf-num">${val}</span>`;
        if (typeof val === 'boolean') return `<span class="jf-bool">${val}</span>`;

        const isArray = Array.isArray(val);
        const entries = isArray ? val.map((v, i) => [i, v]) : Object.entries(val);
        const bracket = isArray ? ['[', ']'] : ['{', '}'];
        const count = entries.length;

        if (count === 0) return `${bracket[0]}${bracket[1]}`;

        let html = `<span class="jf-toggle" onclick="this.classList.toggle('collapsed');this.nextElementSibling.classList.toggle('hidden')">${bracket[0]}</span> <span class="jf-count">${count} ${isArray ? 'items' : 'keys'}</span>`;
        html += `<div class="jf-children">`;
        entries.forEach(([k, v], i) => {
            const comma = i < count - 1 ? ',' : '';
            const keyHtml = isArray ? '' : `<span class="jf-key">"${this._esc(String(k))}"</span>: `;
            html += `<div>${keyHtml}${this._renderNode(v, k)}${comma}</div>`;
        });
        html += `</div>${bracket[1]}`;
        return html;
    },

    _esc(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    _countKeys(obj) {
        if (typeof obj !== 'object' || obj === null) return 0;
        let count = 0;
        const walk = (o) => {
            if (Array.isArray(o)) { count += o.length; o.forEach(walk); }
            else if (typeof o === 'object' && o !== null) {
                const keys = Object.keys(o); count += keys.length;
                keys.forEach(k => walk(o[k]));
            }
        };
        walk(obj);
        return count;
    },

    copyOutput() {
        const output = document.getElementById('jf-output');
        if (output && output.value) {
            navigator.clipboard.writeText(output.value);
            document.getElementById('jf-status').textContent = 'Copied to clipboard';
        }
    },

    clear() {
        document.getElementById('jf-input').value = '';
        document.getElementById('jf-output').value = '';
        document.getElementById('jf-output').style.display = '';
        document.getElementById('jf-tree').style.display = 'none';
        document.getElementById('jf-tree').innerHTML = '';
        document.getElementById('jf-status').textContent = 'Cleared';
    },
};
