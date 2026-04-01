/**
 * Spreadsheet — Mini spreadsheet with formulas (SUM, AVG, MIN, MAX, COUNT)
 */
Apps.Spreadsheet = {
    _rows: 20, _cols: 10, _data: {}, _selected: null,

    open() {
        if (XP.windows['spreadsheet']) { XP.focusWindow('spreadsheet'); return; }
        this._data = {};

        XP.createWindow('spreadsheet', {
            title: 'Spreadsheet',
            icon: 'detail-view.png', width: 800, height: 480,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Spreadsheet.exportCSV()"><img src="${ICON_PATH}/save.png" style="width:16px;height:16px" alt=""> Export CSV</button>
                <button class="toolbar-btn" onclick="Apps.Spreadsheet.clearAll()"><img src="${ICON_PATH}/erase.png" style="width:16px;height:16px" alt=""> Clear</button>
                <div class="toolbar-separator"></div>
                <span style="font-size:10px;color:#666">Cell:</span>
                <input class="xp-input" id="ss-cell-ref" style="width:40px;font-size:10px;font-weight:bold" readonly>
                <span style="font-size:10px;color:#666">fx</span>
                <input class="xp-input" id="ss-formula-bar" style="flex:1;font-size:10px;font-family:Consolas,monospace" onkeydown="if(event.key==='Enter'){Apps.Spreadsheet._applyFormula();event.preventDefault()}" placeholder="Enter value or formula (=SUM(A1:A5))">
            `,
            statusbar: '<span id="ss-status">Ready — Use = for formulas (SUM, AVG, MIN, MAX, COUNT)</span>',
            content: `
                <style>
                    .ss-wrap{height:100%;overflow:auto}
                    .ss-table{border-collapse:collapse;font-size:11px;font-family:Consolas,monospace}
                    .ss-table th{background:#ece9d8;border:1px solid #bbb;padding:2px 4px;font-size:10px;color:#003c74;min-width:70px;position:sticky;top:0;z-index:1}
                    .ss-table th.ss-row-header{min-width:30px;position:sticky;left:0;z-index:2;background:#ece9d8}
                    .ss-table td{border:1px solid #ddd;padding:0;height:22px}
                    .ss-table td.selected{outline:2px solid #316ac5;outline-offset:-1px}
                    .ss-cell{width:100%;height:100%;border:none;padding:2px 4px;font-size:11px;font-family:Consolas,monospace;outline:none;background:transparent}
                    .ss-cell:focus{background:#fff}
                </style>
                <div class="ss-wrap"><table class="ss-table" id="ss-table"></table></div>
            `,
            onReady: () => this._buildTable(),
        });
    },

    _colName(c) { let s = ''; while (c >= 0) { s = String.fromCharCode(65 + c % 26) + s; c = Math.floor(c / 26) - 1; } return s; },

    _buildTable() {
        const table = document.getElementById('ss-table');
        let html = '<tr><th class="ss-row-header"></th>';
        for (let c = 0; c < this._cols; c++) html += `<th>${this._colName(c)}</th>`;
        html += '</tr>';
        for (let r = 0; r < this._rows; r++) {
            html += `<tr><th class="ss-row-header">${r + 1}</th>`;
            for (let c = 0; c < this._cols; c++) {
                const ref = this._colName(c) + (r + 1);
                html += `<td onclick="Apps.Spreadsheet._selectCell('${ref}')" class="${this._selected === ref ? 'selected' : ''}"><input class="ss-cell" id="ss-${ref}" data-ref="${ref}" value="${this._getDisplay(ref)}" onfocus="Apps.Spreadsheet._onFocus('${ref}')" onblur="Apps.Spreadsheet._onBlur('${ref}')" onkeydown="Apps.Spreadsheet._onKey(event,'${ref}')"></td>`;
            }
            html += '</tr>';
        }
        table.innerHTML = html;
    },

    _selectCell(ref) {
        this._selected = ref;
        document.getElementById('ss-cell-ref').value = ref;
        const raw = this._data[ref] || '';
        document.getElementById('ss-formula-bar').value = raw;
        document.querySelectorAll('.ss-table td').forEach(td => td.classList.remove('selected'));
        document.getElementById('ss-' + ref)?.closest('td')?.classList.add('selected');
    },

    _onFocus(ref) {
        this._selectCell(ref);
        const input = document.getElementById('ss-' + ref);
        if (input) input.value = this._data[ref] || '';
    },

    _onBlur(ref) {
        const input = document.getElementById('ss-' + ref);
        if (input) {
            this._data[ref] = input.value;
            input.value = this._getDisplay(ref);
            this._recalcAll();
        }
    },

    _onKey(e, ref) {
        if (e.key === 'Enter') { e.preventDefault(); this._data[ref] = document.getElementById('ss-' + ref).value; this._recalcAll(); const m = ref.match(/([A-Z]+)(\d+)/); if (m) { const next = m[1] + (parseInt(m[2]) + 1); document.getElementById('ss-' + next)?.focus(); } }
        if (e.key === 'Tab') { e.preventDefault(); this._data[ref] = document.getElementById('ss-' + ref).value; this._recalcAll(); const ci = ref.charCodeAt(0) - 65, ri = parseInt(ref.slice(1)); const next = this._colName(ci + 1) + ri; document.getElementById('ss-' + next)?.focus(); }
    },

    _applyFormula() {
        if (!this._selected) return;
        const val = document.getElementById('ss-formula-bar').value;
        this._data[this._selected] = val;
        this._recalcAll();
        document.getElementById('ss-' + this._selected).value = this._getDisplay(this._selected);
    },

    _getDisplay(ref) {
        const raw = this._data[ref];
        if (!raw) return '';
        if (typeof raw === 'string' && raw.startsWith('=')) return this._evalFormula(raw);
        return raw;
    },

    _evalFormula(formula) {
        try {
            let expr = formula.substring(1).toUpperCase();
            // Replace cell references with values
            expr = expr.replace(/\b([A-Z]+)(\d+):([A-Z]+)(\d+)\b/g, (_, c1, r1, c2, r2) => {
                const vals = [];
                const ci1 = c1.charCodeAt(0) - 65, ci2 = c2.charCodeAt(0) - 65;
                for (let c = ci1; c <= ci2; c++) for (let r = parseInt(r1); r <= parseInt(r2); r++) {
                    const v = parseFloat(this._getDisplay(this._colName(c) + r));
                    if (!isNaN(v)) vals.push(v);
                }
                return JSON.stringify(vals);
            });
            expr = expr.replace(/\b([A-Z]+)(\d+)\b/g, (_, c, r) => {
                const v = this._getDisplay(c + r);
                return isNaN(v) || v === '' ? '0' : v;
            });
            // Functions
            expr = expr.replace(/SUM\((\[[\d,.\s-]*\])\)/g, (_, a) => JSON.parse(a).reduce((s, v) => s + v, 0));
            expr = expr.replace(/AVG\((\[[\d,.\s-]*\])\)/g, (_, a) => { const arr = JSON.parse(a); return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; });
            expr = expr.replace(/MIN\((\[[\d,.\s-]*\])\)/g, (_, a) => Math.min(...JSON.parse(a)));
            expr = expr.replace(/MAX\((\[[\d,.\s-]*\])\)/g, (_, a) => Math.max(...JSON.parse(a)));
            expr = expr.replace(/COUNT\((\[[\d,.\s-]*\])\)/g, (_, a) => JSON.parse(a).length);
            const result = Function('"use strict";return (' + expr + ')')();
            return typeof result === 'number' ? (Number.isInteger(result) ? result : result.toFixed(2)) : result;
        } catch { return '#ERR'; }
    },

    _recalcAll() {
        for (let r = 1; r <= this._rows; r++) for (let c = 0; c < this._cols; c++) {
            const ref = this._colName(c) + r;
            const input = document.getElementById('ss-' + ref);
            if (input && document.activeElement !== input) input.value = this._getDisplay(ref);
        }
    },

    clearAll() { this._data = {}; this._recalcAll(); },

    exportCSV() {
        let csv = '';
        for (let r = 1; r <= this._rows; r++) {
            const row = [];
            for (let c = 0; c < this._cols; c++) row.push(this._getDisplay(this._colName(c) + r));
            if (row.some(v => v !== '')) csv += row.map(v => `"${v}"`).join(',') + '\n';
        }
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'spreadsheet.csv'; a.click();
    },
};
