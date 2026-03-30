/**
 * Hash Generator App — Generate & Verify Bcrypt/SHA-256/MD5 hashes
 */
Apps.HashGenerator = {
    open() {
        XP.createWindow('hashgenerator', {
            title: 'Hash Generator',
            icon: 'hash-generator.png',
            width: 460, height: 400,
            content: `
                <style>
                    .hash-tabs { display:flex; gap:2px; margin-bottom:8px; }
                    .hash-tab { padding:5px 16px; font-size:11px; cursor:pointer; border:1px solid #919b9c; border-bottom:none; background:#d4d0c8; border-radius:3px 3px 0 0; position:relative; top:1px; }
                    .hash-tab.active { background:#fff; border-bottom:1px solid #fff; font-weight:bold; z-index:1; }
                    .hash-panel { border:1px solid #919b9c; padding:12px; background:#fff; display:none; }
                    .hash-panel.active { display:block; }
                    .hash-row { margin-bottom:8px; }
                    .hash-row label { display:block; font-size:11px; margin-bottom:2px; font-weight:bold; }
                    .hash-output { background:#f5f3e8; border:1px solid #d4d0c8; padding:6px 8px; font-family:Consolas,monospace; font-size:11px; word-break:break-all; min-height:20px; margin-top:6px; display:flex; align-items:center; gap:6px; }
                    .hash-output span { flex:1; }
                    .hash-copy { font-size:10px; padding:2px 8px; min-width:0; min-height:0; box-shadow:none; }
                    .hash-success { color:#27ae60; font-weight:bold; font-size:12px; }
                    .hash-fail { color:#c0392b; font-weight:bold; font-size:12px; }
                </style>
                <div class="hash-tabs">
                    <div class="hash-tab active" onclick="Apps.HashGenerator.switchTab('generate')">Create Hash</div>
                    <div class="hash-tab" onclick="Apps.HashGenerator.switchTab('verify')">Verify Hash</div>
                </div>
                <div class="hash-panel active" id="hash-generate">
                    <div class="hash-row">
                        <label>Password / Text</label>
                        <input class="xp-input" id="hash-password" style="width:100%" placeholder="Enter text to hash">
                    </div>
                    <div class="hash-row">
                        <label>Algorithm</label>
                        <select class="xp-select" id="hash-algo" style="width:100%">
                            <option value="bcrypt">Bcrypt (recommended)</option>
                            <option value="sha256">SHA-256</option>
                            <option value="md5">MD5</option>
                        </select>
                    </div>
                    <button class="xp-btn xp-btn-primary" onclick="Apps.HashGenerator.generate()">Generate Hash</button>
                    <div class="hash-output" id="hash-result" style="display:none">
                        <span id="hash-result-text"></span>
                        <button class="xp-btn hash-copy" onclick="Apps.HashGenerator.copy()">Copy</button>
                    </div>
                </div>
                <div class="hash-panel" id="hash-verify">
                    <div class="hash-row">
                        <label>Password / Text</label>
                        <input class="xp-input" id="verify-password" style="width:100%" placeholder="Enter plain text">
                    </div>
                    <div class="hash-row">
                        <label>Hash to Verify</label>
                        <input class="xp-input" id="verify-hash" style="width:100%" placeholder="Paste hash here" style="font-family:Consolas,monospace">
                    </div>
                    <button class="xp-btn xp-btn-primary" onclick="Apps.HashGenerator.verify()">Verify</button>
                    <div id="verify-result" style="margin-top:8px"></div>
                </div>
            `,
        });
    },

    switchTab(tab) {
        document.querySelectorAll('.hash-tab').forEach((t,i) => {
            t.classList.toggle('active', (tab==='generate'?i===0:i===1));
        });
        document.getElementById('hash-generate').classList.toggle('active', tab==='generate');
        document.getElementById('hash-verify').classList.toggle('active', tab==='verify');
    },

    async generate() {
        const pw = document.getElementById('hash-password')?.value;
        const algo = document.getElementById('hash-algo')?.value;
        if (!pw) { XP.notify('Error','Enter text to hash'); return; }

        const res = await XP.api('/api/hash/generate', 'POST', { password: pw, algorithm: algo });
        if (res.success) {
            document.getElementById('hash-result').style.display = 'flex';
            document.getElementById('hash-result-text').textContent = res.data.hash;
        } else {
            XP.notify('Error', res.message || 'Failed to generate hash');
        }
    },

    async verify() {
        const pw = document.getElementById('verify-password')?.value;
        const hash = document.getElementById('verify-hash')?.value;
        if (!pw || !hash) { XP.notify('Error','Enter both password and hash'); return; }

        const res = await XP.api('/api/hash/verify', 'POST', { password: pw, hash: hash });
        const el = document.getElementById('verify-result');
        if (res.data?.match) {
            el.innerHTML = `<div class="hash-success">✓ Match! (${esc(res.data.format)})</div>`;
        } else {
            el.innerHTML = `<div class="hash-fail">✕ No match</div>`;
        }
    },

    copy() {
        const text = document.getElementById('hash-result-text')?.textContent;
        if (text) { navigator.clipboard.writeText(text); XP.notify('Copied','Hash copied to clipboard'); }
    },
};
