/**
 * Diff Viewer — Compare two texts side by side
 * Line-by-line diff with color highlights
 */
Apps.DiffViewer = {
    open() {
        if (XP.windows['diffviewer']) { XP.focusWindow('diffviewer'); return; }

        XP.createWindow('diffviewer', {
            title: 'Diff Viewer',
            icon: 'detail-view.png',
            width: 800, height: 520,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.DiffViewer.compare()"><img src="${ICON_PATH}/search-folder.png" style="width:16px;height:16px" alt=""> Compare</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.DiffViewer.swap()"><img src="${ICON_PATH}/redo.png" style="width:16px;height:16px" alt=""> Swap</button>
                <button class="toolbar-btn" onclick="Apps.DiffViewer.clear()"><img src="${ICON_PATH}/erase.png" style="width:16px;height:16px" alt=""> Clear</button>
            `,
            statusbar: '<span id="dv-status">Paste text in both panels and click Compare</span>',
            content: `
                <style>
                    .dv-wrap { display:flex; flex-direction:column; height:100%; }
                    .dv-editors { display:flex; flex:1; gap:0; }
                    .dv-panel { flex:1; display:flex; flex-direction:column; }
                    .dv-panel-label { font-size:10px; font-weight:bold; color:#666; padding:3px 6px; background:#ece9d8; border-bottom:1px solid #d4d0c8; }
                    .dv-area { flex:1; width:100%; resize:none; font-family:Consolas,monospace; font-size:12px; padding:6px; border:none; border-right:1px solid #d4d0c8; outline:none; }
                    .dv-result { max-height:50%; overflow:auto; border-top:2px solid #d4d0c8; }
                    .dv-result table { width:100%; border-collapse:collapse; font-family:Consolas,monospace; font-size:11px; }
                    .dv-result td { padding:1px 6px; vertical-align:top; white-space:pre-wrap; word-break:break-all; }
                    .dv-ln { width:30px; text-align:right; color:#999; background:#f0ece0; border-right:1px solid #d4d0c8; user-select:none; font-size:10px; }
                    .dv-add { background:#d4edda; }
                    .dv-del { background:#f8d7da; }
                    .dv-chg { background:#fff3cd; }
                    .dv-eq { background:#fff; }
                    .dv-sep { background:#e8e8e8; }
                    .dv-gutter { width:20px; text-align:center; font-size:10px; font-weight:bold; }
                    .dv-gutter.dv-add { color:#155724; }
                    .dv-gutter.dv-del { color:#721c24; }
                    .dv-gutter.dv-chg { color:#856404; }
                </style>
                <div class="dv-wrap">
                    <div class="dv-editors">
                        <div class="dv-panel">
                            <div class="dv-panel-label">Original (Left)</div>
                            <textarea class="dv-area" id="dv-left" placeholder="Paste original text here..." spellcheck="false"></textarea>
                        </div>
                        <div class="dv-panel">
                            <div class="dv-panel-label">Modified (Right)</div>
                            <textarea class="dv-area" id="dv-right" style="border-right:none" placeholder="Paste modified text here..." spellcheck="false"></textarea>
                        </div>
                    </div>
                    <div class="dv-result" id="dv-result"></div>
                </div>
            `,
        });
    },

    compare() {
        const left = (document.getElementById('dv-left')?.value || '').split('\n');
        const right = (document.getElementById('dv-right')?.value || '').split('\n');
        const diff = this._diff(left, right);
        const result = document.getElementById('dv-result');
        const status = document.getElementById('dv-status');

        let html = '<table>';
        let added = 0, removed = 0, changed = 0;

        diff.forEach(d => {
            const cls = d.type === 'add' ? 'dv-add' : d.type === 'del' ? 'dv-del' : d.type === 'chg' ? 'dv-chg' : 'dv-eq';
            const sym = d.type === 'add' ? '+' : d.type === 'del' ? '-' : d.type === 'chg' ? '~' : '';
            const lnL = d.lineL ?? '';
            const lnR = d.lineR ?? '';

            if (d.type === 'add') added++;
            else if (d.type === 'del') removed++;
            else if (d.type === 'chg') changed++;

            html += `<tr>
                <td class="dv-ln">${lnL}</td>
                <td class="${cls}" style="width:45%">${this._esc(d.left || '')}</td>
                <td class="dv-gutter ${cls}">${sym}</td>
                <td class="dv-ln">${lnR}</td>
                <td class="${cls}" style="width:45%">${this._esc(d.right || '')}</td>
            </tr>`;
        });

        html += '</table>';
        result.innerHTML = html;

        const same = diff.filter(d => d.type === 'eq').length;
        status.textContent = `${added} added, ${removed} removed, ${changed} changed, ${same} unchanged`;
    },

    _diff(left, right) {
        const result = [];
        const maxLen = Math.max(left.length, right.length);
        // Simple line-by-line LCS-based diff
        const lcs = this._lcs(left, right);
        let li = 0, ri = 0, ci = 0;

        while (li < left.length || ri < right.length) {
            if (ci < lcs.length && li < left.length && ri < right.length && left[li] === lcs[ci] && right[ri] === lcs[ci]) {
                result.push({ type: 'eq', left: left[li], right: right[ri], lineL: li + 1, lineR: ri + 1 });
                li++; ri++; ci++;
            } else if (ci < lcs.length && ri < right.length && right[ri] === lcs[ci]) {
                result.push({ type: 'del', left: left[li], right: '', lineL: li + 1, lineR: '' });
                li++;
            } else if (ci < lcs.length && li < left.length && left[li] === lcs[ci]) {
                result.push({ type: 'add', left: '', right: right[ri], lineL: '', lineR: ri + 1 });
                ri++;
            } else if (li < left.length && ri < right.length) {
                result.push({ type: 'chg', left: left[li], right: right[ri], lineL: li + 1, lineR: ri + 1 });
                li++; ri++;
            } else if (li < left.length) {
                result.push({ type: 'del', left: left[li], right: '', lineL: li + 1, lineR: '' });
                li++;
            } else {
                result.push({ type: 'add', left: '', right: right[ri], lineL: '', lineR: ri + 1 });
                ri++;
            }
        }
        return result;
    },

    _lcs(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
                dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);

        const result = [];
        let i = m, j = n;
        while (i > 0 && j > 0) {
            if (a[i-1] === b[j-1]) { result.unshift(a[i-1]); i--; j--; }
            else if (dp[i-1][j] > dp[i][j-1]) i--;
            else j--;
        }
        return result;
    },

    swap() {
        const l = document.getElementById('dv-left');
        const r = document.getElementById('dv-right');
        const tmp = l.value; l.value = r.value; r.value = tmp;
    },

    clear() {
        document.getElementById('dv-left').value = '';
        document.getElementById('dv-right').value = '';
        document.getElementById('dv-result').innerHTML = '';
        document.getElementById('dv-status').textContent = 'Cleared';
    },

    _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
};
