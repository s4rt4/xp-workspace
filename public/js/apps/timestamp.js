/**
 * Unix Timestamp Converter — Convert between timestamps and dates
 */
Apps.Timestamp = {
    _interval: null,

    open() {
        if (XP.windows['timestamp']) { XP.focusWindow('timestamp'); return; }

        XP.createWindow('timestamp', {
            title: 'Unix Timestamp',
            icon: 'date-and-time.png',
            width: 440, height: 440,
            resizable: false,
            content: `
                <style>
                    .ts-wrap { padding:12px; }
                    .ts-section { font-size:10px; font-weight:bold; color:#666; margin:12px 0 4px; border-bottom:1px solid #d4d0c8; padding-bottom:2px; }
                    .ts-section:first-child { margin-top:0; }
                    .ts-now { font-family:Consolas,monospace; font-size:28px; font-weight:bold; color:#c0392b; text-align:center; padding:8px; cursor:pointer; }
                    .ts-now-label { text-align:center; font-size:10px; color:#888; margin-bottom:4px; }
                    .ts-now-date { text-align:center; font-size:12px; color:#444; font-family:Consolas,monospace; }
                    .ts-row { display:flex; align-items:center; gap:6px; margin:6px 0; }
                    .ts-row label { font-size:11px; width:70px; font-weight:bold; color:#444; }
                    .ts-row input { flex:1; font-family:Consolas,monospace; font-size:12px; }
                    .ts-row button { min-width:70px; }
                    .ts-result { font-family:Consolas,monospace; font-size:12px; padding:6px; background:#fafafa; border:1px solid #d4d0c8; margin:6px 0; min-height:20px; cursor:pointer; }
                    .ts-result:hover { background:#e8f0fe; }
                    .ts-formats { font-size:11px; }
                    .ts-formats div { padding:2px 0; display:flex; justify-content:space-between; border-bottom:1px solid #f0ece0; }
                    .ts-formats span:last-child { font-family:Consolas,monospace; cursor:pointer; color:#1a1aa6; }
                    .ts-formats span:last-child:hover { text-decoration:underline; }
                </style>
                <div class="ts-wrap">
                    <div class="ts-section">CURRENT TIMESTAMP</div>
                    <div class="ts-now-label">Click to copy</div>
                    <div class="ts-now" id="ts-now" onclick="Apps.Timestamp.copyNow()" title="Click to copy">—</div>
                    <div class="ts-now-date" id="ts-now-date"></div>

                    <div class="ts-section">TIMESTAMP → DATE</div>
                    <div class="ts-row">
                        <label>Timestamp</label>
                        <input class="xp-input" id="ts-input" placeholder="e.g. 1700000000">
                        <button class="xp-btn" onclick="Apps.Timestamp.toDate()">Convert</button>
                    </div>
                    <div class="ts-result" id="ts-to-date" onclick="Apps.Timestamp._copy(this.textContent)"></div>

                    <div class="ts-section">DATE → TIMESTAMP</div>
                    <div class="ts-row">
                        <label>Date/Time</label>
                        <input class="xp-input" type="datetime-local" id="ts-date-input" step="1">
                        <button class="xp-btn" onclick="Apps.Timestamp.toTimestamp()">Convert</button>
                    </div>
                    <div class="ts-result" id="ts-to-ts" onclick="Apps.Timestamp._copy(this.textContent)"></div>

                    <div class="ts-section">COMMON FORMATS</div>
                    <div class="ts-formats" id="ts-formats"></div>
                </div>
            `,
            onReady: () => {
                this._tick();
                this._interval = setInterval(() => this._tick(), 1000);
                // Set date input to now
                const now = new Date();
                document.getElementById('ts-date-input').value = this._toLocalISO(now);
                this._renderFormats(now);
            },
            onClose: () => {
                clearInterval(this._interval);
                this._interval = null;
            },
        });
    },

    _tick() {
        const now = new Date();
        const ts = Math.floor(now.getTime() / 1000);
        const el = document.getElementById('ts-now');
        if (el) el.textContent = ts;
        const dateEl = document.getElementById('ts-now-date');
        if (dateEl) dateEl.textContent = now.toLocaleString() + ' (local)';
    },

    toDate() {
        const input = document.getElementById('ts-input')?.value?.trim();
        const result = document.getElementById('ts-to-date');
        if (!input) { result.textContent = ''; return; }

        let ts = parseInt(input);
        if (isNaN(ts)) { result.textContent = 'Invalid timestamp'; return; }

        // Auto-detect seconds vs milliseconds
        if (ts > 1e12) ts = Math.floor(ts / 1000);
        const date = new Date(ts * 1000);

        if (isNaN(date.getTime())) { result.textContent = 'Invalid timestamp'; return; }

        result.textContent = date.toLocaleString() + ' (local)';
        this._renderFormats(date);
    },

    toTimestamp() {
        const input = document.getElementById('ts-date-input')?.value;
        const result = document.getElementById('ts-to-ts');
        if (!input) { result.textContent = ''; return; }

        const date = new Date(input);
        if (isNaN(date.getTime())) { result.textContent = 'Invalid date'; return; }

        const ts = Math.floor(date.getTime() / 1000);
        result.textContent = `${ts}  (seconds)  |  ${ts * 1000}  (milliseconds)`;
        this._renderFormats(date);
    },

    _renderFormats(date) {
        const el = document.getElementById('ts-formats');
        if (!el) return;
        const formats = [
            ['ISO 8601', date.toISOString()],
            ['UTC', date.toUTCString()],
            ['Local', date.toLocaleString()],
            ['Date only', date.toLocaleDateString()],
            ['Time only', date.toLocaleTimeString()],
            ['RFC 2822', date.toString()],
            ['Relative', this._relative(date)],
        ];
        el.innerHTML = formats.map(([label, val]) =>
            `<div><span>${label}</span><span onclick="Apps.Timestamp._copy('${val.replace(/'/g, "\\'")}')" title="Click to copy">${val}</span></div>`
        ).join('');
    },

    _relative(date) {
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (Math.abs(diff) < 60) return `${Math.abs(diff)} seconds ${diff > 0 ? 'ago' : 'from now'}`;
        if (Math.abs(diff) < 3600) return `${Math.floor(Math.abs(diff)/60)} minutes ${diff > 0 ? 'ago' : 'from now'}`;
        if (Math.abs(diff) < 86400) return `${Math.floor(Math.abs(diff)/3600)} hours ${diff > 0 ? 'ago' : 'from now'}`;
        return `${Math.floor(Math.abs(diff)/86400)} days ${diff > 0 ? 'ago' : 'from now'}`;
    },

    _toLocalISO(date) {
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },

    copyNow() {
        const el = document.getElementById('ts-now');
        if (el) { navigator.clipboard.writeText(el.textContent); }
    },

    _copy(text) {
        navigator.clipboard.writeText(text);
    },
};
