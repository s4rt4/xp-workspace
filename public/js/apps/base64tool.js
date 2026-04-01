/**
 * Base64 Tool — Encode/decode text & files to/from Base64
 */
Apps.Base64Tool = {
    open() {
        if (XP.windows['base64tool']) { XP.focusWindow('base64tool'); return; }

        XP.createWindow('base64tool', {
            title: 'Base64 Encoder',
            icon: 'key.png',
            width: 680, height: 460,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Base64Tool.encode()"><img src="${ICON_PATH}/attributes.png" style="width:16px;height:16px" alt=""> Encode</button>
                <button class="toolbar-btn" onclick="Apps.Base64Tool.decode()"><img src="${ICON_PATH}/properties.png" style="width:16px;height:16px" alt=""> Decode</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Base64Tool.encodeFile()"><img src="${ICON_PATH}/open.png" style="width:16px;height:16px" alt=""> File → Base64</button>
                <button class="toolbar-btn" onclick="Apps.Base64Tool.decodeToFile()"><img src="${ICON_PATH}/save.png" style="width:16px;height:16px" alt=""> Base64 → File</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Base64Tool.encodeURL()">URL Encode</button>
                <button class="toolbar-btn" onclick="Apps.Base64Tool.decodeURL()">URL Decode</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Base64Tool.swap()"><img src="${ICON_PATH}/redo.png" style="width:16px;height:16px" alt=""> Swap</button>
                <button class="toolbar-btn" onclick="Apps.Base64Tool.copyOutput()"><img src="${ICON_PATH}/copy.png" style="width:16px;height:16px" alt=""> Copy</button>
            `,
            statusbar: '<span id="b64-status">Ready</span>',
            content: `
                <style>
                    .b64-wrap { display:flex; flex-direction:column; height:100%; padding:6px; gap:4px; }
                    .b64-label { font-size:10px; font-weight:bold; color:#666; }
                    .b64-area { flex:1; width:100%; resize:none; font-family:Consolas,monospace; font-size:12px; padding:6px; border:1px solid #7f9db9; }
                    .b64-info { font-size:10px; color:#888; text-align:right; }
                </style>
                <div class="b64-wrap">
                    <div class="b64-label">INPUT</div>
                    <textarea class="b64-area" id="b64-input" placeholder="Enter text or Base64 string..." oninput="Apps.Base64Tool._updateInfo()" spellcheck="false"></textarea>
                    <div class="b64-info" id="b64-input-info"></div>
                    <div class="b64-label">OUTPUT</div>
                    <textarea class="b64-area" id="b64-output" readonly style="background:#fafafa" spellcheck="false"></textarea>
                    <div class="b64-info" id="b64-output-info"></div>
                    <input type="file" id="b64-file" style="display:none">
                </div>
            `,
        });
    },

    encode() {
        const input = document.getElementById('b64-input')?.value || '';
        try {
            const encoded = btoa(unescape(encodeURIComponent(input)));
            document.getElementById('b64-output').value = encoded;
            this._status(`Encoded: ${input.length} chars → ${encoded.length} chars`);
            this._updateInfo();
        } catch (e) {
            this._status('Encode error: ' + e.message);
        }
    },

    decode() {
        const input = document.getElementById('b64-input')?.value?.trim() || '';
        try {
            const decoded = decodeURIComponent(escape(atob(input)));
            document.getElementById('b64-output').value = decoded;
            this._status(`Decoded: ${input.length} chars → ${decoded.length} chars`);
            this._updateInfo();
        } catch (e) {
            this._status('Invalid Base64 string');
        }
    },

    encodeURL() {
        const input = document.getElementById('b64-input')?.value || '';
        const encoded = encodeURIComponent(input);
        document.getElementById('b64-output').value = encoded;
        this._status(`URL encoded: ${input.length} → ${encoded.length} chars`);
    },

    decodeURL() {
        const input = document.getElementById('b64-input')?.value || '';
        try {
            const decoded = decodeURIComponent(input);
            document.getElementById('b64-output').value = decoded;
            this._status(`URL decoded: ${input.length} → ${decoded.length} chars`);
        } catch (e) {
            this._status('Invalid URL-encoded string');
        }
    },

    encodeFile() {
        const input = document.getElementById('b64-file');
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target.result.split(',')[1] || ev.target.result;
                document.getElementById('b64-output').value = base64;
                const dataUri = ev.target.result;
                document.getElementById('b64-input').value = `[File: ${file.name}, ${this._fmtSize(file.size)}, ${file.type}]\n\nData URI:\n${dataUri}`;
                this._status(`File encoded: ${file.name} (${this._fmtSize(file.size)}) → ${base64.length} chars`);
                this._updateInfo();
            };
            reader.readAsDataURL(file);
            input.value = '';
        };
        input.click();
    },

    decodeToFile() {
        const b64 = document.getElementById('b64-input')?.value?.trim() || '';
        if (!b64) { this._status('Paste Base64 in input first'); return; }
        try {
            const binary = atob(b64.replace(/^data:[^;]+;base64,/, ''));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes]);
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'decoded_file';
            a.click();
            URL.revokeObjectURL(a.href);
            this._status(`File downloaded: ${this._fmtSize(blob.size)}`);
        } catch (e) {
            this._status('Invalid Base64 for file decode');
        }
    },

    swap() {
        const inp = document.getElementById('b64-input');
        const out = document.getElementById('b64-output');
        const tmp = inp.value;
        inp.value = out.value;
        out.value = tmp;
        this._updateInfo();
        this._status('Swapped input/output');
    },

    copyOutput() {
        const out = document.getElementById('b64-output')?.value;
        if (out) {
            navigator.clipboard.writeText(out);
            this._status('Copied to clipboard');
        }
    },

    _status(msg) {
        const el = document.getElementById('b64-status');
        if (el) el.textContent = msg;
    },

    _updateInfo() {
        const inp = document.getElementById('b64-input')?.value || '';
        const out = document.getElementById('b64-output')?.value || '';
        const ii = document.getElementById('b64-input-info');
        const oi = document.getElementById('b64-output-info');
        if (ii) ii.textContent = `${inp.length} chars, ${new Blob([inp]).size} bytes`;
        if (oi) oi.textContent = `${out.length} chars, ${new Blob([out]).size} bytes`;
    },

    _fmtSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    },
};
