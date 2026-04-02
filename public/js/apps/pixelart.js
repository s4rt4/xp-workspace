/**
 * Pixel Art Editor — Grid-based pixel art with palette, layers, export
 */
Apps.PixelArt = {
    _w: 32, _h: 32, _pixelSize: 14,
    _color: '#000000',
    _tool: 'pencil',
    _grid: [],
    _drawing: false,
    _history: [], _histIdx: -1,

    open() {
        if (XP.windows['pixelart']) { XP.focusWindow('pixelart'); return; }

        XP.createWindow('pixelart', {
            title: 'Pixel Art Editor',
            icon: 'bitmap.png',
            width: 750, height: 560,
            toolbar: `
                <button class="toolbar-btn active" id="px-t-pencil" onclick="Apps.PixelArt.setTool('pencil')">✏ Draw</button>
                <button class="toolbar-btn" id="px-t-eraser" onclick="Apps.PixelArt.setTool('eraser')"><img src="${ICON_PATH}/erase.png" style="width:16px;height:16px" alt=""> Erase</button>
                <button class="toolbar-btn" id="px-t-fill" onclick="Apps.PixelArt.setTool('fill')">🪣 Fill</button>
                <button class="toolbar-btn" id="px-t-picker" onclick="Apps.PixelArt.setTool('picker')">💉 Pick</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.PixelArt.undo()">↩</button>
                <button class="toolbar-btn" onclick="Apps.PixelArt.redo()">↪</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.PixelArt.clearAll()"><img src="${ICON_PATH}/delete.png" style="width:16px;height:16px" alt=""> Clear</button>
                <button class="toolbar-btn" onclick="Apps.PixelArt.exportPNG()"><img src="${ICON_PATH}/save.png" style="width:16px;height:16px" alt=""> Export PNG</button>
                <button class="toolbar-btn" onclick="Apps.PixelArt.exportPNG(true)">Export 1x</button>
            `,
            statusbar: '<span id="px-status">32×32 — Draw with left click</span>',
            content: `
                <style>
                    .px-wrap{display:flex;height:100%}
                    .px-sidebar{width:160px;background:#1e1e1e;border-right:1px solid #333;overflow-y:auto;padding:8px;flex-shrink:0}
                    .px-sidebar h4{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:10px 0 4px}
                    .px-sidebar h4:first-child{margin-top:0}
                    .px-color-preview{width:100%;height:32px;border-radius:4px;border:2px solid #555;margin-bottom:6px}
                    .px-color-input{width:100%;height:24px;border:none;cursor:pointer;border-radius:2px}
                    .px-palette{display:flex;flex-wrap:wrap;gap:2px}
                    .px-pal-swatch{width:18px;height:18px;border:1px solid #555;cursor:pointer;border-radius:2px}
                    .px-pal-swatch:hover{border-color:#fff;transform:scale(1.15)}
                    .px-pal-swatch.active{border:2px solid #fff}
                    .px-size-row{display:flex;gap:4px;margin-top:4px}
                    .px-size-btn{flex:1;background:#333;color:#ccc;border:1px solid #555;padding:3px;font-size:9px;cursor:pointer;text-align:center;border-radius:2px;min-width:0;min-height:0;box-shadow:none}
                    .px-size-btn:hover{background:#555}
                    .px-size-btn.active{background:#316ac5;border-color:#316ac5;color:#fff}
                    .px-canvas-wrap{flex:1;overflow:auto;background:#2a2a2a;display:flex;align-items:center;justify-content:center}
                    .px-canvas-wrap canvas{image-rendering:pixelated;cursor:crosshair}
                </style>
                <div class="px-wrap">
                    <div class="px-sidebar">
                        <h4>Color</h4>
                        <div class="px-color-preview" id="px-preview" style="background:#000"></div>
                        <input type="color" class="px-color-input" id="px-color" value="#000000" oninput="Apps.PixelArt._color=this.value;document.getElementById('px-preview').style.background=this.value">

                        <h4>Palette</h4>
                        <div class="px-palette" id="px-palette"></div>

                        <h4>Canvas Size</h4>
                        <div class="px-size-row">
                            <div class="px-size-btn" onclick="Apps.PixelArt.resize(16,16)">16²</div>
                            <div class="px-size-btn active" onclick="Apps.PixelArt.resize(32,32)">32²</div>
                            <div class="px-size-btn" onclick="Apps.PixelArt.resize(48,48)">48²</div>
                            <div class="px-size-btn" onclick="Apps.PixelArt.resize(64,64)">64²</div>
                        </div>

                        <h4>Zoom</h4>
                        <div class="px-size-row">
                            <div class="px-size-btn" onclick="Apps.PixelArt.setZoom(8)">8x</div>
                            <div class="px-size-btn" onclick="Apps.PixelArt.setZoom(12)">12x</div>
                            <div class="px-size-btn active" onclick="Apps.PixelArt.setZoom(14)">14x</div>
                            <div class="px-size-btn" onclick="Apps.PixelArt.setZoom(18)">18x</div>
                        </div>
                    </div>
                    <div class="px-canvas-wrap">
                        <canvas id="px-canvas"></canvas>
                    </div>
                </div>
            `,
            onReady: () => { this._initGrid(); this._renderPalette(); },
        });
    },

    _initGrid() {
        this._grid = Array.from({ length: this._h }, () => Array(this._w).fill(''));
        this._history = []; this._histIdx = -1;
        this._renderCanvas();
        this._saveHistory();

        const canvas = document.getElementById('px-canvas');
        canvas.addEventListener('mousedown', (e) => { this._drawing = true; this._paint(e); });
        canvas.addEventListener('mousemove', (e) => { if (this._drawing) this._paint(e); });
        canvas.addEventListener('mouseup', () => { this._drawing = false; this._saveHistory(); });
        canvas.addEventListener('mouseleave', () => { this._drawing = false; });
    },

    _paint(e) {
        const canvas = document.getElementById('px-canvas');
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this._pixelSize);
        const y = Math.floor((e.clientY - rect.top) / this._pixelSize);
        if (x < 0 || x >= this._w || y < 0 || y >= this._h) return;

        if (this._tool === 'pencil') {
            this._grid[y][x] = this._color;
        } else if (this._tool === 'eraser') {
            this._grid[y][x] = '';
        } else if (this._tool === 'fill') {
            this._floodFill(x, y, this._grid[y][x], this._color);
            this._saveHistory();
        } else if (this._tool === 'picker') {
            if (this._grid[y][x]) {
                this._color = this._grid[y][x];
                document.getElementById('px-color').value = this._color;
                document.getElementById('px-preview').style.background = this._color;
            }
            return;
        }
        this._renderCanvas();
        document.getElementById('px-status').textContent = `${this._w}×${this._h} — (${x}, ${y}) ${this._color}`;
    },

    _floodFill(x, y, target, replacement) {
        if (target === replacement) return;
        if (x < 0 || x >= this._w || y < 0 || y >= this._h) return;
        if (this._grid[y][x] !== target) return;
        this._grid[y][x] = replacement;
        this._floodFill(x + 1, y, target, replacement);
        this._floodFill(x - 1, y, target, replacement);
        this._floodFill(x, y + 1, target, replacement);
        this._floodFill(x, y - 1, target, replacement);
    },

    _renderCanvas() {
        const canvas = document.getElementById('px-canvas');
        if (!canvas) return;
        const ps = this._pixelSize;
        canvas.width = this._w * ps;
        canvas.height = this._h * ps;
        const ctx = canvas.getContext('2d');

        // Transparent checkerboard
        for (let y = 0; y < this._h; y++) {
            for (let x = 0; x < this._w; x++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? '#ccc' : '#eee';
                ctx.fillRect(x * ps, y * ps, ps, ps);
                if (this._grid[y][x]) {
                    ctx.fillStyle = this._grid[y][x];
                    ctx.fillRect(x * ps, y * ps, ps, ps);
                }
            }
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= this._w; x++) { ctx.beginPath(); ctx.moveTo(x * ps, 0); ctx.lineTo(x * ps, this._h * ps); ctx.stroke(); }
        for (let y = 0; y <= this._h; y++) { ctx.beginPath(); ctx.moveTo(0, y * ps); ctx.lineTo(this._w * ps, y * ps); ctx.stroke(); }
    },

    setTool(t) {
        this._tool = t;
        document.querySelectorAll('[id^="px-t-"]').forEach(b => b.classList.remove('active'));
        document.getElementById('px-t-' + t)?.classList.add('active');
    },

    setZoom(z) {
        this._pixelSize = z;
        this._renderCanvas();
    },

    resize(w, h) {
        this._w = w; this._h = h;
        this._grid = Array.from({ length: h }, (_, y) =>
            Array.from({ length: w }, (_, x) => (this._grid[y]?.[x]) || '')
        );
        this._renderCanvas();
        this._saveHistory();
        document.getElementById('px-status').textContent = `${w}×${h}`;
    },

    clearAll() {
        this._grid = Array.from({ length: this._h }, () => Array(this._w).fill(''));
        this._renderCanvas();
        this._saveHistory();
    },

    exportPNG(original) {
        const scale = original ? 1 : this._pixelSize;
        const c = document.createElement('canvas');
        c.width = this._w * scale; c.height = this._h * scale;
        const ctx = c.getContext('2d');
        for (let y = 0; y < this._h; y++) {
            for (let x = 0; x < this._w; x++) {
                if (this._grid[y][x]) {
                    ctx.fillStyle = this._grid[y][x];
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
        const a = document.createElement('a');
        a.href = c.toDataURL('image/png');
        a.download = `pixel-art-${this._w}x${this._h}.png`;
        a.click();
    },

    _saveHistory() {
        this._histIdx++;
        this._history = this._history.slice(0, this._histIdx);
        this._history.push(JSON.stringify(this._grid));
        if (this._history.length > 50) { this._history.shift(); this._histIdx--; }
    },

    undo() {
        if (this._histIdx <= 0) return;
        this._histIdx--;
        this._grid = JSON.parse(this._history[this._histIdx]);
        this._renderCanvas();
    },

    redo() {
        if (this._histIdx >= this._history.length - 1) return;
        this._histIdx++;
        this._grid = JSON.parse(this._history[this._histIdx]);
        this._renderCanvas();
    },

    _renderPalette() {
        const colors = [
            '#000000','#ffffff','#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff',
            '#c0c0c0','#808080','#800000','#808000','#008000','#800080','#008080','#000080',
            '#ff6633','#ffcc33','#99ff33','#33ff99','#33ccff','#9933ff','#ff3399','#663300',
            '#ff9999','#ffcc99','#ffff99','#99ff99','#99ffff','#9999ff','#ff99ff','#cc9966',
        ];
        document.getElementById('px-palette').innerHTML = colors.map(c =>
            `<div class="px-pal-swatch" style="background:${c}" onclick="Apps.PixelArt._color='${c}';document.getElementById('px-color').value='${c}';document.getElementById('px-preview').style.background='${c}'"></div>`
        ).join('');
    },
};
