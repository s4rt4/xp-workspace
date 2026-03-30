/**
 * CSV Viewer App — Multi-format data viewer (CSV, JSON, Excel, Log, Markdown)
 * Based on CSV_Viewer project
 */
Apps.CSVViewer = {
    _libsLoaded: false,
    currentData: [],
    currentHeaders: [],

    open() {
        this._loadLibs().then(() => this._createWindow());
    },

    _js(u){return new Promise(r=>{if(document.querySelector(`script[src="${u}"]`))return r();const s=document.createElement('script');s.src=u;s.onload=r;document.head.appendChild(s);});},
    _css(u){if(!document.querySelector(`link[href="${u}"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href=u;document.head.appendChild(l);}return Promise.resolve();},

    _loadLibs() {
        if (this._libsLoaded) return Promise.resolve();
        return Promise.all([
            this._js('https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js'),
            this._js('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'),
            this._js('https://cdn.jsdelivr.net/npm/marked/marked.min.js'),
        ]).then(() => { this._libsLoaded = true; });
    },

    _createWindow() {
        XP.createWindow('csvviewer', {
            title: 'Data Viewer',
            icon: 'detail-view.png',
            width: 820, height: 520,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.CSVViewer.openFile()"><img src="${ICON_PATH}/folder-opened.png" style="width:16px;height:16px" alt=""> Open File</button>
                <div class="toolbar-separator"></div>
                <input class="xp-input" id="csv-search" placeholder="Search..." style="width:150px" oninput="Apps.CSVViewer.search(this.value)">
                <div class="toolbar-separator"></div>
                <span style="font-size:10px;color:#888" id="csv-info"></span>
            `,
            statusbar: '<span class="statusbar-section" id="csv-status">Open a CSV, JSON, Excel, Log, or Markdown file</span>',
            content: `
                <style>
                    .csv-empty { text-align:center; padding:60px 20px; color:#999; }
                    .csv-empty img { width:48px; height:48px; opacity:0.3; margin-bottom:8px; }
                    #csv-table-wrap { overflow:auto; height:100%; margin:-8px; padding:4px; }
                    #csv-table-wrap table { width:100%; border-collapse:collapse; font-size:11px; }
                    #csv-table-wrap th { background:linear-gradient(180deg,#fff,#e8e4d8); border:1px solid #c8c0ae; padding:3px 8px; text-align:left; font-weight:normal; white-space:nowrap; position:sticky; top:0; z-index:1; cursor:pointer; }
                    #csv-table-wrap th:hover { background:#d8d8e8; }
                    #csv-table-wrap td { padding:2px 8px; border-bottom:1px solid #f0ece0; white-space:nowrap; max-width:300px; overflow:hidden; text-overflow:ellipsis; }
                    #csv-table-wrap tr:hover td { background:#e8f0fe; }
                    .csv-md { padding:12px 16px; line-height:1.6; font-size:12px; }
                    .csv-md h1 { font-size:18px; color:#003; } .csv-md h2 { font-size:15px; color:#036; } .csv-md code { background:#f0ece0; padding:1px 4px; }
                    .csv-md pre { background:#f0ece0; padding:8px; border:1px solid #d4d0c8; overflow-x:auto; }
                    .csv-log-error { color:#e53935; font-weight:bold; }
                    .csv-log-warn { color:#f57c00; }
                    .csv-log-info { color:#1976d2; }
                </style>
                <div id="csv-table-wrap">
                    <div class="csv-empty"><img src="${ICON_PATH}/detail-view.png" alt="" onerror="this.style.display='none'"><div>Open a file to view data</div><div style="font-size:10px;margin-top:4px">Supports: CSV, JSON, Excel (.xlsx), Log, Markdown</div></div>
                </div>
                <input type="file" id="csv-file-input" accept=".csv,.json,.xlsx,.xls,.log,.txt,.md" style="display:none" onchange="Apps.CSVViewer.handleFile(this)">
            `,
        });
    },

    openFile() { document.getElementById('csv-file-input')?.click(); },

    handleFile(input) {
        const file = input.files?.[0]; if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();

        if (ext === 'xlsx' || ext === 'xls') {
            reader.onload = (e) => this._parseExcel(e.target.result, file.name);
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (e) => {
                const text = e.target.result;
                if (ext === 'csv') this._parseCSV(text, file.name);
                else if (ext === 'json') this._parseJSON(text, file.name);
                else if (ext === 'md') this._parseMarkdown(text, file.name);
                else this._parseLog(text, file.name);
            };
            reader.readAsText(file);
        }
        input.value = '';
    },

    _parseCSV(text, name) {
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        this.currentHeaders = result.meta.fields || [];
        this.currentData = result.data;
        this._renderTable(name);
    },

    _parseJSON(text, name) {
        try {
            let data = JSON.parse(text);
            if (!Array.isArray(data)) data = [data];
            // Flatten objects
            const flat = data.map(item => {
                if (typeof item !== 'object' || item === null) return { value: item };
                const out = {};
                const flatten = (obj, prefix = '') => {
                    for (const [k, v] of Object.entries(obj)) {
                        const key = prefix ? `${prefix}.${k}` : k;
                        if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key);
                        else out[key] = Array.isArray(v) ? JSON.stringify(v) : v;
                    }
                };
                flatten(item);
                return out;
            });
            this.currentHeaders = [...new Set(flat.flatMap(Object.keys))];
            this.currentData = flat;
            this._renderTable(name);
        } catch (e) {
            XP.notify('Error', 'Invalid JSON file');
        }
    },

    _parseExcel(buffer, name) {
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        this.currentHeaders = data.length ? Object.keys(data[0]) : [];
        this.currentData = data;
        this._renderTable(name);
    },

    _parseMarkdown(text, name) {
        const wrap = document.getElementById('csv-table-wrap');
        if (!wrap) return;
        wrap.innerHTML = `<div class="csv-md">${marked.parse(text)}</div>`;
        this._setStatus(name, 'Markdown');
    },

    _parseLog(text, name) {
        const lines = text.split('\n').filter(l => l.trim());
        const wrap = document.getElementById('csv-table-wrap');
        if (!wrap) return;
        wrap.innerHTML = `<table><tr><th>#</th><th>Log Line</th></tr>${lines.map((l, i) => {
            let cls = '';
            if (/error/i.test(l)) cls = 'csv-log-error';
            else if (/warn/i.test(l)) cls = 'csv-log-warn';
            else if (/info/i.test(l)) cls = 'csv-log-info';
            return `<tr><td>${i + 1}</td><td class="${cls}" style="white-space:pre-wrap;max-width:none">${esc(l)}</td></tr>`;
        }).join('')}</table>`;
        this._setStatus(name, `${lines.length} lines`);
    },

    _renderTable(name) {
        const wrap = document.getElementById('csv-table-wrap');
        if (!wrap) return;
        const h = this.currentHeaders, d = this.currentData;
        wrap.innerHTML = `<table><tr>${h.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${d.map(row =>
            `<tr>${h.map(c => `<td title="${esc(String(row[c]??''))}">${esc(String(row[c]??''))}</td>`).join('')}</tr>`
        ).join('')}</table>`;
        this._setStatus(name, `${d.length} rows × ${h.length} cols`);
    },

    _setStatus(name, info) {
        const s = document.getElementById('csv-status');
        if (s) s.textContent = name;
        const i = document.getElementById('csv-info');
        if (i) i.textContent = info;
    },

    search(q) {
        if (!q) { this._renderTable('Search cleared'); return; }
        const ql = q.toLowerCase();
        const filtered = this.currentData.filter(row =>
            this.currentHeaders.some(h => String(row[h] ?? '').toLowerCase().includes(ql))
        );
        const wrap = document.getElementById('csv-table-wrap');
        if (!wrap) return;
        const h = this.currentHeaders;
        wrap.innerHTML = `<table><tr>${h.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${filtered.map(row =>
            `<tr>${h.map(c => `<td>${esc(String(row[c]??''))}</td>`).join('')}</tr>`
        ).join('')}</table>`;
        const i = document.getElementById('csv-info');
        if (i) i.textContent = `${filtered.length} of ${this.currentData.length} rows`;
    },
};
