/**
 * Regex Tester — Live regex testing with match highlighting
 */
Apps.RegexTester = {
    open() {
        if (XP.windows['regextester']) { XP.focusWindow('regextester'); return; }

        XP.createWindow('regextester', {
            title: 'Regex Tester',
            icon: 'graph-view.png',
            width: 700, height: 500,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.RegexTester.test()"><img src="${ICON_PATH}/search-folder.png" style="width:16px;height:16px" alt=""> Test</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.RegexTester.loadExample('email')">Email</button>
                <button class="toolbar-btn" onclick="Apps.RegexTester.loadExample('url')">URL</button>
                <button class="toolbar-btn" onclick="Apps.RegexTester.loadExample('ip')">IP</button>
                <button class="toolbar-btn" onclick="Apps.RegexTester.loadExample('phone')">Phone</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.RegexTester.clear()"><img src="${ICON_PATH}/erase.png" style="width:16px;height:16px" alt=""> Clear</button>
            `,
            statusbar: '<span id="rx-status">Enter a regex pattern and test string</span>',
            content: `
                <style>
                    .rx-wrap { padding:8px; display:flex; flex-direction:column; height:100%; gap:6px; }
                    .rx-row { display:flex; gap:6px; align-items:center; }
                    .rx-row label { font-size:11px; font-weight:bold; width:55px; color:#444; }
                    .rx-row input { flex:1; font-family:Consolas,monospace; font-size:12px; }
                    .rx-flags { display:flex; gap:8px; font-size:11px; }
                    .rx-flags label { width:auto; font-weight:normal; cursor:pointer; display:flex; align-items:center; gap:2px; }
                    .rx-input { flex:1; min-height:80px; resize:none; font-family:Consolas,monospace; font-size:12px; padding:6px; border:1px solid #7f9db9; }
                    .rx-result { flex:1; overflow:auto; border:1px solid #d4d0c8; background:#fafafa; padding:6px; font-family:Consolas,monospace; font-size:12px; line-height:1.6; }
                    .rx-hl { background:#ffeb3b; border-radius:2px; padding:0 1px; }
                    .rx-group { font-size:10px; color:#666; background:#e8e8e8; padding:1px 4px; border-radius:2px; margin:0 2px; }
                    .rx-matches { flex:1; overflow:auto; border:1px solid #d4d0c8; background:#fff; }
                    .rx-match-item { padding:3px 8px; font-size:11px; font-family:Consolas,monospace; border-bottom:1px solid #f0ece0; }
                    .rx-match-item:nth-child(odd) { background:#f8f6f0; }
                    .rx-match-idx { color:#888; font-size:10px; margin-right:6px; }
                    .rx-match-val { color:#c0392b; font-weight:bold; }
                    .rx-match-grp { color:#2980b9; margin-left:10px; }
                    .rx-section { font-size:10px; font-weight:bold; color:#666; margin:2px 0; }
                </style>
                <div class="rx-wrap">
                    <div class="rx-row">
                        <label>Pattern</label>
                        <input class="xp-input" id="rx-pattern" placeholder="e.g. (\\w+)@(\\w+\\.\\w+)" oninput="Apps.RegexTester.test()">
                    </div>
                    <div class="rx-row">
                        <label>Flags</label>
                        <div class="rx-flags">
                            <label><input type="checkbox" id="rx-g" checked onchange="Apps.RegexTester.test()"> g (global)</label>
                            <label><input type="checkbox" id="rx-i" onchange="Apps.RegexTester.test()"> i (case-insensitive)</label>
                            <label><input type="checkbox" id="rx-m" onchange="Apps.RegexTester.test()"> m (multiline)</label>
                            <label><input type="checkbox" id="rx-s" onchange="Apps.RegexTester.test()"> s (dotAll)</label>
                        </div>
                    </div>
                    <div class="rx-section">TEST STRING</div>
                    <textarea class="rx-input" id="rx-input" placeholder="Enter text to test against..." oninput="Apps.RegexTester.test()">The quick brown fox jumps over the lazy dog.
Contact: john@example.com or jane@test.org
Phone: 123-456-7890 and (555) 123-4567</textarea>
                    <div class="rx-section">HIGHLIGHTED RESULT</div>
                    <div class="rx-result" id="rx-result"></div>
                    <div class="rx-section">MATCHES</div>
                    <div class="rx-matches" id="rx-matches"></div>
                </div>
            `,
            onReady: () => this.test(),
        });
    },

    _getFlags() {
        let f = '';
        if (document.getElementById('rx-g')?.checked) f += 'g';
        if (document.getElementById('rx-i')?.checked) f += 'i';
        if (document.getElementById('rx-m')?.checked) f += 'm';
        if (document.getElementById('rx-s')?.checked) f += 's';
        return f;
    },

    test() {
        const pattern = document.getElementById('rx-pattern')?.value;
        const input = document.getElementById('rx-input')?.value || '';
        const result = document.getElementById('rx-result');
        const matches = document.getElementById('rx-matches');
        const status = document.getElementById('rx-status');

        if (!pattern) {
            result.innerHTML = this._esc(input);
            matches.innerHTML = '';
            status.textContent = 'Enter a regex pattern';
            return;
        }

        let regex;
        try {
            regex = new RegExp(pattern, this._getFlags());
        } catch (e) {
            result.innerHTML = `<span style="color:red">Invalid regex: ${this._esc(e.message)}</span>`;
            matches.innerHTML = '';
            status.textContent = 'Invalid pattern';
            return;
        }

        // Highlight matches
        let highlighted = '';
        let lastIdx = 0;
        let matchCount = 0;
        let matchHtml = '';
        const allMatches = [];

        if (regex.global) {
            let m;
            while ((m = regex.exec(input)) !== null) {
                highlighted += this._esc(input.slice(lastIdx, m.index));
                highlighted += `<span class="rx-hl">${this._esc(m[0])}</span>`;
                lastIdx = m.index + m[0].length;
                allMatches.push(m);
                matchCount++;
                if (m[0].length === 0) { regex.lastIndex++; }
                if (matchCount > 1000) break;
            }
            highlighted += this._esc(input.slice(lastIdx));
        } else {
            const m = regex.exec(input);
            if (m) {
                highlighted = this._esc(input.slice(0, m.index));
                highlighted += `<span class="rx-hl">${this._esc(m[0])}</span>`;
                highlighted += this._esc(input.slice(m.index + m[0].length));
                allMatches.push(m);
                matchCount = 1;
            } else {
                highlighted = this._esc(input);
            }
        }

        result.innerHTML = highlighted || this._esc(input);

        // Render match details
        allMatches.forEach((m, i) => {
            matchHtml += `<div class="rx-match-item"><span class="rx-match-idx">#${i + 1}</span> <span class="rx-match-val">${this._esc(m[0])}</span> <span style="color:#888;font-size:10px">index ${m.index}</span>`;
            for (let g = 1; g < m.length; g++) {
                if (m[g] !== undefined) {
                    matchHtml += `<span class="rx-match-grp">Group ${g}: ${this._esc(m[g])}</span>`;
                }
            }
            matchHtml += '</div>';
        });
        matches.innerHTML = matchHtml || '<div class="rx-match-item" style="color:#888">No matches</div>';
        status.textContent = `${matchCount} match${matchCount !== 1 ? 'es' : ''} found`;
    },

    loadExample(type) {
        const examples = {
            email: { pattern: '[\\w.-]+@[\\w.-]+\\.\\w{2,}', text: 'Contact us at support@example.com or sales@company.org\nInvalid: @bad .no-at test@' },
            url: { pattern: 'https?://[\\w.-]+(?:/[\\w./?&=%#-]*)?', text: 'Visit https://example.com/page?q=test\nOr http://sub.domain.org/path/to/file.html\nNot a url: ftp://other' },
            ip: { pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', text: 'Server IPs: 192.168.1.1, 10.0.0.255, 172.16.0.1\nInvalid: 999.999.999.999 (still matches pattern)' },
            phone: { pattern: '(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', text: 'Call us: (555) 123-4567 or +1-800-555-0199\nLocal: 021-555-1234' },
        };
        const ex = examples[type];
        if (!ex) return;
        document.getElementById('rx-pattern').value = ex.pattern;
        document.getElementById('rx-input').value = ex.text;
        this.test();
    },

    clear() {
        document.getElementById('rx-pattern').value = '';
        document.getElementById('rx-input').value = '';
        document.getElementById('rx-result').innerHTML = '';
        document.getElementById('rx-matches').innerHTML = '';
        document.getElementById('rx-status').textContent = 'Cleared';
    },

    _esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    },
};
