/**
 * API Tester — Mini Postman-like REST API testing tool
 */
Apps.APITester = {
    _history: [],

    open() {
        if (XP.windows['apitester']) { XP.focusWindow('apitester'); return; }
        try { this._history = JSON.parse(localStorage.getItem('xp_api_history')) || []; } catch { this._history = []; }

        XP.createWindow('apitester', {
            title: 'API Tester',
            icon: 'network-connection.png', width: 800, height: 520,
            content: `
                <style>
                    .at-wrap{display:flex;height:100%;font-size:11px}
                    .at-sidebar{width:180px;background:#252526;border-right:1px solid #1e1e1e;overflow-y:auto;flex-shrink:0}
                    .at-sidebar-title{color:#888;font-size:9px;text-transform:uppercase;letter-spacing:1px;padding:8px;font-weight:bold}
                    .at-hist-item{padding:4px 8px;color:#ccc;cursor:pointer;font-size:10px;border-bottom:1px solid #333;display:flex;gap:4px;align-items:center}
                    .at-hist-item:hover{background:#2a2d2e}
                    .at-method-badge{font-size:8px;font-weight:bold;padding:1px 4px;border-radius:2px;min-width:26px;text-align:center}
                    .at-method-badge.GET{background:#27ae60;color:#fff}
                    .at-method-badge.POST{background:#f39c12;color:#fff}
                    .at-method-badge.PUT{background:#3498db;color:#fff}
                    .at-method-badge.DELETE{background:#e74c3c;color:#fff}
                    .at-main{flex:1;display:flex;flex-direction:column;min-width:0}
                    .at-request{padding:8px;background:#f5f3e8;border-bottom:1px solid #d4d0c8}
                    .at-url-row{display:flex;gap:4px;margin-bottom:6px}
                    .at-url-row select{width:80px}
                    .at-url-row input{flex:1;font-family:Consolas,monospace;font-size:11px}
                    .at-tabs{display:flex;gap:0;border-bottom:1px solid #d4d0c8}
                    .at-tab{padding:4px 12px;cursor:pointer;font-size:10px;border:1px solid transparent;border-bottom:none;margin-bottom:-1px}
                    .at-tab.active{background:#fff;border-color:#d4d0c8;border-bottom:1px solid #fff;font-weight:bold}
                    .at-tab-body{padding:6px}
                    .at-tab-body textarea{width:100%;height:80px;font-family:Consolas,monospace;font-size:11px;border:1px solid #d4d0c8;padding:4px;resize:vertical}
                    .at-response{flex:1;display:flex;flex-direction:column;min-height:0}
                    .at-res-header{padding:4px 8px;background:#ece9d8;border-bottom:1px solid #d4d0c8;display:flex;gap:12px;align-items:center;font-size:10px}
                    .at-res-status{font-weight:bold}
                    .at-res-status.ok{color:#27ae60}
                    .at-res-status.err{color:#e74c3c}
                    .at-res-body{flex:1;overflow:auto;padding:8px;font-family:Consolas,monospace;font-size:11px;white-space:pre-wrap;word-break:break-all;background:#fff}
                </style>
                <div class="at-wrap">
                    <div class="at-sidebar">
                        <div class="at-sidebar-title">History</div>
                        <div id="at-history"></div>
                    </div>
                    <div class="at-main">
                        <div class="at-request">
                            <div class="at-url-row">
                                <select class="xp-select" id="at-method"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select>
                                <input class="xp-input" id="at-url" placeholder="https://api.example.com/endpoint" value="https://jsonplaceholder.typicode.com/posts/1">
                                <button class="xp-btn xp-btn-primary" onclick="Apps.APITester.send()" style="font-size:11px">Send</button>
                            </div>
                            <div class="at-tabs">
                                <div class="at-tab active" onclick="Apps.APITester._showTab('headers')">Headers</div>
                                <div class="at-tab" onclick="Apps.APITester._showTab('body')">Body</div>
                            </div>
                            <div class="at-tab-body" id="at-tab-headers">
                                <textarea id="at-headers" placeholder="Content-Type: application/json&#10;Authorization: Bearer token">Content-Type: application/json</textarea>
                            </div>
                            <div class="at-tab-body" id="at-tab-body" style="display:none">
                                <textarea id="at-body" placeholder='{"key": "value"}'></textarea>
                            </div>
                        </div>
                        <div class="at-response">
                            <div class="at-res-header">
                                <span>Status: <span id="at-status" class="at-res-status">—</span></span>
                                <span>Time: <span id="at-time">—</span></span>
                                <span>Size: <span id="at-size">—</span></span>
                            </div>
                            <div class="at-res-body" id="at-res-body">Response will appear here...</div>
                        </div>
                    </div>
                </div>
            `,
            onReady: () => this._renderHistory(),
        });
    },

    _showTab(name) {
        document.getElementById('at-tab-headers').style.display = name === 'headers' ? '' : 'none';
        document.getElementById('at-tab-body').style.display = name === 'body' ? '' : 'none';
        document.querySelectorAll('.at-tab').forEach((t, i) => t.classList.toggle('active', (i === 0 && name === 'headers') || (i === 1 && name === 'body')));
    },

    async send() {
        const method = document.getElementById('at-method').value;
        const url = document.getElementById('at-url').value.trim();
        if (!url) return;

        const headersRaw = document.getElementById('at-headers').value;
        const body = document.getElementById('at-body').value;
        const resBody = document.getElementById('at-res-body');
        const statusEl = document.getElementById('at-status');
        const timeEl = document.getElementById('at-time');
        const sizeEl = document.getElementById('at-size');

        resBody.textContent = 'Loading...';
        statusEl.textContent = '...'; statusEl.className = 'at-res-status';

        const headers = {};
        headersRaw.split('\n').forEach(line => {
            const [k, ...v] = line.split(':');
            if (k?.trim() && v.length) headers[k.trim()] = v.join(':').trim();
        });

        const opts = { method, headers };
        if (body && method !== 'GET') opts.body = body;

        const t0 = performance.now();
        try {
            const res = await fetch(url, opts);
            const elapsed = Math.round(performance.now() - t0);
            const text = await res.text();

            statusEl.textContent = res.status + ' ' + res.statusText;
            statusEl.className = 'at-res-status ' + (res.ok ? 'ok' : 'err');
            timeEl.textContent = elapsed + 'ms';
            sizeEl.textContent = (text.length / 1024).toFixed(1) + ' KB';

            try { resBody.textContent = JSON.stringify(JSON.parse(text), null, 2); } catch { resBody.textContent = text; }

            this._history.unshift({ method, url, status: res.status, time: elapsed });
            if (this._history.length > 30) this._history.pop();
            localStorage.setItem('xp_api_history', JSON.stringify(this._history));
            this._renderHistory();
        } catch (e) {
            statusEl.textContent = 'Error'; statusEl.className = 'at-res-status err';
            timeEl.textContent = Math.round(performance.now() - t0) + 'ms';
            resBody.textContent = e.message;
        }
    },

    _renderHistory() {
        const el = document.getElementById('at-history');
        if (!el) return;
        el.innerHTML = this._history.map(h => {
            const short = h.url.replace(/https?:\/\//, '').substring(0, 30);
            return `<div class="at-hist-item" onclick="document.getElementById('at-method').value='${h.method}';document.getElementById('at-url').value='${h.url.replace(/'/g, "\\'")}'" title="${h.url}">
                <span class="at-method-badge ${h.method}">${h.method}</span>
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${short}</span>
                <span style="color:#888">${h.status}</span>
            </div>`;
        }).join('') || '<div style="padding:8px;color:#666;text-align:center">No history</div>';
    },
};
