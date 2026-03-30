/**
 * Image Tools App — Compress, Crop, Resize images
 * Client-side Canvas processing + optional API compression
 */
Apps.ImageTools = {
    files: [],

    open() {
        XP.createWindow('imagetools', {
            title: 'Image Tools',
            icon: 'images-tool.png',
            width: 700, height: 480,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.ImageTools.pickFiles()"><img src="${ICON_PATH}/add.png" style="width:16px;height:16px" alt=""> Add Images</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.ImageTools.settings()"><img src="${ICON_PATH}/properties.png" style="width:16px;height:16px" alt="" onerror="this.style.display='none'"> API Keys</button>
            `,
            statusbar: '<span class="statusbar-section" id="img-status">Ready</span>',
            content: `
                <style>
                    .it-tabs { display:flex; border-bottom:1px solid #919b9c; margin:-8px -8px 8px; padding:0 4px; background:#ece9d8; }
                    .it-tab { padding:5px 16px; font-size:11px; cursor:pointer; border:1px solid transparent; border-bottom:none; margin-bottom:-1px; border-radius:3px 3px 0 0; }
                    .it-tab.active { background:#fff; border-color:#919b9c; border-bottom:1px solid #fff; font-weight:bold; }
                    .it-tab:hover:not(.active) { background:#e8e4d8; }
                    .it-panel { display:none; }
                    .it-panel.active { display:block; }
                    .it-options { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px; align-items:flex-end; padding:8px; background:#f5f3e8; border:1px solid #d4d0c8; }
                    .it-opt label { display:block; font-size:10px; color:#666; margin-bottom:2px; }
                    .it-results { max-height:280px; overflow-y:auto; }
                    .it-result-row { display:flex; align-items:center; gap:8px; padding:4px 6px; border-bottom:1px solid #f0ece0; font-size:11px; }
                    .it-result-row:hover { background:#e8f0fe; }
                    .it-result-row img { width:40px; height:40px; object-fit:cover; border:1px solid #d4d0c8; }
                    .it-result-row .it-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
                    .it-result-row .it-size { color:#666; min-width:60px; text-align:right; }
                    .it-result-row .it-saving { color:#27ae60; font-weight:bold; min-width:50px; text-align:right; }
                    .it-dl { font-size:10px; padding:2px 8px; min-width:0; min-height:0; box-shadow:none; }
                </style>
                <div class="it-tabs">
                    <div class="it-tab active" onclick="Apps.ImageTools.switchTab('compress')">Compress</div>
                    <div class="it-tab" onclick="Apps.ImageTools.switchTab('crop')">Crop</div>
                    <div class="it-tab" onclick="Apps.ImageTools.switchTab('resize')">Resize</div>
                </div>

                <div class="it-panel active" id="it-compress">
                    <div class="it-options">
                        <div class="it-opt"><label>Quality</label><input class="xp-input" type="range" id="it-quality" min="1" max="100" value="80" style="width:120px" oninput="document.getElementById('it-q-val').textContent=this.value+'%'"> <span id="it-q-val">80%</span></div>
                        <div class="it-opt"><label>Format</label><select class="xp-select" id="it-format"><option value="jpeg">JPEG</option><option value="png">PNG</option><option value="webp">WebP</option></select></div>
                        <button class="xp-btn xp-btn-primary" onclick="Apps.ImageTools.compress()">Compress All</button>
                    </div>
                    <div class="it-results" id="it-compress-results"></div>
                </div>

                <div class="it-panel" id="it-crop">
                    <div class="it-options">
                        <div class="it-opt"><label>Width</label><input class="xp-input" type="number" id="it-crop-w" value="400" min="1" style="width:70px"></div>
                        <div class="it-opt"><label>Height</label><input class="xp-input" type="number" id="it-crop-h" value="400" min="1" style="width:70px"></div>
                        <button class="xp-btn xp-btn-primary" onclick="Apps.ImageTools.crop()">Crop All</button>
                    </div>
                    <div class="it-results" id="it-crop-results"></div>
                </div>

                <div class="it-panel" id="it-resize">
                    <div class="it-options">
                        <div class="it-opt"><label>Method</label><select class="xp-select" id="it-resize-method" onchange="Apps.ImageTools._resizeMethodChange()">
                            <option value="fixed">Fixed Size</option><option value="percent">Percentage</option><option value="template">Template</option>
                        </select></div>
                        <div class="it-opt" id="it-resize-fixed">
                            <label>Width</label><input class="xp-input" type="number" id="it-rw" value="800" min="1" style="width:70px">
                            <label>Height</label><input class="xp-input" type="number" id="it-rh" value="600" min="1" style="width:70px">
                        </div>
                        <div class="it-opt" id="it-resize-pct" style="display:none">
                            <label>Scale %</label><input class="xp-input" type="number" id="it-rpct" value="50" min="1" max="500" style="width:70px">
                        </div>
                        <div class="it-opt" id="it-resize-tpl" style="display:none">
                            <label>Template</label><select class="xp-select" id="it-rtpl">
                                <option value="640,480">VGA 640×480</option><option value="1280,720">HD 1280×720</option>
                                <option value="1920,1080" selected>Full HD 1920×1080</option><option value="2560,1440">2K 2560×1440</option><option value="3840,2160">4K 3840×2160</option>
                            </select>
                        </div>
                        <div class="it-opt"><label>Format</label><select class="xp-select" id="it-rformat"><option value="jpeg">JPEG</option><option value="png">PNG</option><option value="webp">WebP</option></select></div>
                        <button class="xp-btn xp-btn-primary" onclick="Apps.ImageTools.resize()">Resize All</button>
                    </div>
                    <div class="it-results" id="it-resize-results"></div>
                </div>

                <input type="file" id="it-file-input" accept="image/*" multiple style="display:none" onchange="Apps.ImageTools.handleFiles(this)">
            `,
        });
    },

    switchTab(tab) {
        document.querySelectorAll('.it-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.it-panel').forEach(p => p.classList.remove('active'));
        document.querySelector(`.it-tab[onclick*="${tab}"]`)?.classList.add('active');
        document.getElementById(`it-${tab}`)?.classList.add('active');
    },

    _resizeMethodChange() {
        const m = document.getElementById('it-resize-method').value;
        document.getElementById('it-resize-fixed').style.display = m === 'fixed' ? '' : 'none';
        document.getElementById('it-resize-pct').style.display = m === 'percent' ? '' : 'none';
        document.getElementById('it-resize-tpl').style.display = m === 'template' ? '' : 'none';
    },

    pickFiles() { document.getElementById('it-file-input')?.click(); },

    handleFiles(input) {
        this.files = Array.from(input.files || []);
        const s = document.getElementById('img-status');
        if (s) s.textContent = `${this.files.length} image(s) loaded`;
        input.value = '';
    },

    _fmtSize(b) {
        if (!b) return '0 B';
        const k = 1024, s = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
    },

    _processImage(file, targetW, targetH, format, quality) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetW || img.width;
                canvas.height = targetH || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    resolve({
                        name: file.name,
                        originalSize: file.size,
                        newSize: blob.size,
                        blob,
                        url: URL.createObjectURL(blob),
                    });
                }, `image/${format}`, quality / 100);
            };
            img.src = URL.createObjectURL(file);
        });
    },

    _renderResults(el, results) {
        el.innerHTML = results.map((r, i) => `
            <div class="it-result-row">
                <img src="${r.url}" alt="">
                <span class="it-name">${esc(r.name)}</span>
                <span class="it-size">${this._fmtSize(r.originalSize)} → ${this._fmtSize(r.newSize)}</span>
                <span class="it-saving">${r.originalSize > 0 ? Math.round((1 - r.newSize / r.originalSize) * 100) : 0}%</span>
                <button class="xp-btn it-dl" onclick="Apps.ImageTools._download(${i})">Save</button>
            </div>
        `).join('');
        this._lastResults = results;
    },

    _download(i) {
        const r = this._lastResults?.[i];
        if (!r) return;
        const a = document.createElement('a');
        a.href = r.url; a.download = r.name; a.click();
    },

    async compress() {
        if (!this.files.length) { XP.notify('No images', 'Add images first'); return; }
        const quality = parseInt(document.getElementById('it-quality').value) || 80;
        const format = document.getElementById('it-format').value;
        const el = document.getElementById('it-compress-results');
        el.innerHTML = '<div style="padding:12px;color:#888">Processing...</div>';

        const results = [];
        for (const file of this.files) {
            results.push(await this._processImage(file, 0, 0, format, quality));
        }
        this._renderResults(el, results);
        document.getElementById('img-status').textContent = `Compressed ${results.length} image(s)`;
    },

    async crop() {
        if (!this.files.length) { XP.notify('No images', 'Add images first'); return; }
        const w = parseInt(document.getElementById('it-crop-w').value) || 400;
        const h = parseInt(document.getElementById('it-crop-h').value) || 400;
        const el = document.getElementById('it-crop-results');
        el.innerHTML = '<div style="padding:12px;color:#888">Processing...</div>';

        const results = [];
        for (const file of this.files) {
            results.push(await this._processImage(file, w, h, 'jpeg', 90));
        }
        this._renderResults(el, results);
    },

    async resize() {
        if (!this.files.length) { XP.notify('No images', 'Add images first'); return; }
        const method = document.getElementById('it-resize-method').value;
        const format = document.getElementById('it-rformat').value;
        const el = document.getElementById('it-resize-results');
        el.innerHTML = '<div style="padding:12px;color:#888">Processing...</div>';

        const results = [];
        for (const file of this.files) {
            let w, h;
            if (method === 'fixed') {
                w = parseInt(document.getElementById('it-rw').value);
                h = parseInt(document.getElementById('it-rh').value);
            } else if (method === 'percent') {
                const pct = parseInt(document.getElementById('it-rpct').value) / 100;
                const img = new Image(); img.src = URL.createObjectURL(file);
                await new Promise(r => { img.onload = r; });
                w = Math.round(img.width * pct);
                h = Math.round(img.height * pct);
            } else {
                const [tw, th] = document.getElementById('it-rtpl').value.split(',').map(Number);
                w = tw; h = th;
            }
            results.push(await this._processImage(file, w, h, format, 90));
        }
        this._renderResults(el, results);
    },

    settings() {
        ApiKeys.showSettings('compress', [
            { id: 'tinypng', name: 'TinyPNG' },
            { id: 'tinypng2', name: 'TinyPNG (Key 2)' },
            { id: 'imagekit', name: 'ImageKit' },
            { id: 'cloudinary', name: 'Cloudinary', extraFields: [{ key: 'cloudName', placeholder: 'Cloud Name' }, { key: 'apiSecret', placeholder: 'API Secret' }] },
            { id: 'shortpixel', name: 'ShortPixel' },
            { id: 'ewww', name: 'EWWW' },
            { id: 'imagify', name: 'Imagify' },
        ]);
    },
};
