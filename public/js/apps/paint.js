/**
 * Paint — Simple drawing app with canvas
 * Tools: pencil, line, rectangle, circle, fill, eraser, text
 */
Apps.Paint = {
    canvas: null,
    ctx: null,
    drawing: false,
    tool: 'pencil',
    color: '#000000',
    lineWidth: 2,
    startX: 0, startY: 0,
    snapshot: null,
    history: [],
    historyIdx: -1,

    open() {
        if (XP.windows['paint']) { XP.focusWindow('paint'); return; }

        XP.createWindow('paint', {
            title: 'Paint',
            icon: 'paint.png',
            width: 800, height: 560,
            toolbar: `
                <button class="toolbar-btn active" id="pt-tool-pencil" onclick="Apps.Paint.setTool('pencil')"><img src="${ICON_PATH}/pen_r.cur" style="width:16px;height:16px" alt="" onerror="this.parentElement.innerHTML='&#9998; Pencil'"> Pencil</button>
                <button class="toolbar-btn" id="pt-tool-line" onclick="Apps.Paint.setTool('line')"><img src="${ICON_PATH}/default_size3.cur" style="width:16px;height:16px" alt="" onerror="this.parentElement.innerHTML='/ Line'"> Line</button>
                <button class="toolbar-btn" id="pt-tool-rect" onclick="Apps.Paint.setTool('rect')"><img src="${ICON_PATH}/default_box.cur" style="width:16px;height:16px" alt="" onerror="this.parentElement.innerHTML='&#9633; Rect'"> Rect</button>
                <button class="toolbar-btn" id="pt-tool-circle" onclick="Apps.Paint.setTool('circle')"><img src="${ICON_PATH}/default_dvd.cur" style="width:16px;height:16px" alt="" onerror="this.parentElement.innerHTML='&#9675; Circle'"> Circle</button>
                <button class="toolbar-btn" id="pt-tool-eraser" onclick="Apps.Paint.setTool('eraser')"><img src="${ICON_PATH}/erase.png" style="width:16px;height:16px" alt=""> Eraser</button>
                <button class="toolbar-btn" id="pt-tool-fill" onclick="Apps.Paint.setTool('fill')"><img src="${ICON_PATH}/color-profile.png" style="width:16px;height:16px" alt=""> Fill</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Paint.undo()"><img src="${ICON_PATH}/undo.png" style="width:16px;height:16px" alt=""> Undo</button>
                <button class="toolbar-btn" onclick="Apps.Paint.redo()"><img src="${ICON_PATH}/redo.png" style="width:16px;height:16px" alt=""> Redo</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Paint.clearCanvas()"><img src="${ICON_PATH}/delete.png" style="width:16px;height:16px" alt=""> Clear</button>
                <button class="toolbar-btn" onclick="Apps.Paint.save()"><img src="${ICON_PATH}/save.png" style="width:16px;height:16px" alt=""> Save</button>
            `,
            statusbar: '<span id="pt-status">Pencil | 2px</span>',
            content: `
                <style>
                    .pt-wrap { display:flex; height:100%; }
                    .pt-sidebar { width:40px; background:#ece9d8; border-right:1px solid #d4d0c8; padding:4px; display:flex; flex-direction:column; gap:4px; align-items:center; }
                    .pt-color { width:28px; height:28px; border:2px solid #808080; cursor:pointer; border-radius:2px; }
                    .pt-palette { display:flex; flex-wrap:wrap; gap:2px; width:32px; }
                    .pt-palswatch { width:14px; height:14px; border:1px solid #808080; cursor:pointer; }
                    .pt-palswatch:hover { border-color:#000; }
                    .pt-size-label { font-size:9px; color:#666; margin-top:4px; }
                    .pt-canvas-wrap { flex:1; overflow:auto; background:#808080; display:flex; align-items:flex-start; justify-content:flex-start; }
                    .pt-canvas-wrap canvas { background:#fff; cursor:crosshair; }
                </style>
                <div class="pt-wrap">
                    <div class="pt-sidebar">
                        <input type="color" class="pt-color" id="pt-color" value="#000000" oninput="Apps.Paint.color=this.value">
                        <div class="pt-palette" id="pt-palette"></div>
                        <div class="pt-size-label">Size</div>
                        <input type="range" id="pt-size" min="1" max="30" value="2" style="width:32px;writing-mode:vertical-lr" oninput="Apps.Paint.lineWidth=+this.value;document.getElementById('pt-status').textContent=Apps.Paint.tool+' | '+this.value+'px'">
                    </div>
                    <div class="pt-canvas-wrap" id="pt-canvas-wrap">
                        <canvas id="pt-canvas"></canvas>
                    </div>
                </div>
            `,
            onReady: (win, content) => {
                this._initCanvas(content);
                this._renderPalette();
            },
        });
    },

    _initCanvas(content) {
        this.canvas = document.getElementById('pt-canvas');
        this.ctx = this.canvas.getContext('2d');
        const wrap = document.getElementById('pt-canvas-wrap');
        this.canvas.width = wrap.clientWidth - 4;
        this.canvas.height = wrap.clientHeight - 4;
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this._saveHistory();

        this.canvas.addEventListener('mousedown', (e) => this._onDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._onMove(e));
        this.canvas.addEventListener('mouseup', () => this._onUp());
        this.canvas.addEventListener('mouseleave', () => this._onUp());
    },

    _getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return [e.clientX - rect.left, e.clientY - rect.top];
    },

    _onDown(e) {
        this.drawing = true;
        const [x, y] = this._getPos(e);
        this.startX = x; this.startY = y;

        if (this.tool === 'fill') {
            this._floodFill(Math.round(x), Math.round(y), this.color);
            this.drawing = false;
            this._saveHistory();
            return;
        }

        this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = this.tool === 'eraser' ? '#ffffff' : this.color;
        this.ctx.lineWidth = this.tool === 'eraser' ? this.lineWidth * 3 : this.lineWidth;

        if (this.tool === 'pencil' || this.tool === 'eraser') {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        }
    },

    _onMove(e) {
        if (!this.drawing) return;
        const [x, y] = this._getPos(e);

        if (this.tool === 'pencil' || this.tool === 'eraser') {
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        } else {
            this.ctx.putImageData(this.snapshot, 0, 0);
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.beginPath();

            if (this.tool === 'line') {
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(x, y);
            } else if (this.tool === 'rect') {
                this.ctx.rect(this.startX, this.startY, x - this.startX, y - this.startY);
            } else if (this.tool === 'circle') {
                const rx = Math.abs(x - this.startX) / 2, ry = Math.abs(y - this.startY) / 2;
                const cx = this.startX + (x - this.startX) / 2, cy = this.startY + (y - this.startY) / 2;
                this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            }
            this.ctx.stroke();
        }
    },

    _onUp() {
        if (!this.drawing) return;
        this.drawing = false;
        this._saveHistory();
    },

    setTool(tool) {
        this.tool = tool;
        document.querySelectorAll('[id^="pt-tool-"]').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById('pt-tool-' + tool);
        if (btn) btn.classList.add('active');
        document.getElementById('pt-status').textContent = tool + ' | ' + this.lineWidth + 'px';
    },

    _saveHistory() {
        this.historyIdx++;
        this.history = this.history.slice(0, this.historyIdx);
        this.history.push(this.canvas.toDataURL());
        if (this.history.length > 50) { this.history.shift(); this.historyIdx--; }
    },

    undo() {
        if (this.historyIdx <= 0) return;
        this.historyIdx--;
        this._restoreHistory();
    },

    redo() {
        if (this.historyIdx >= this.history.length - 1) return;
        this.historyIdx++;
        this._restoreHistory();
    },

    _restoreHistory() {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = this.history[this.historyIdx];
    },

    clearCanvas() {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this._saveHistory();
    },

    save() {
        const a = document.createElement('a');
        a.href = this.canvas.toDataURL('image/png');
        a.download = 'painting.png';
        a.click();
        document.getElementById('pt-status').textContent = 'Saved as painting.png';
    },

    _floodFill(x, y, fillColor) {
        const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imgData.data;
        const w = this.canvas.width, h = this.canvas.height;
        const idx = (y * w + x) * 4;
        const tr = data[idx], tg = data[idx+1], tb = data[idx+2], ta = data[idx+3];

        // Parse fill color
        const tmp = document.createElement('canvas').getContext('2d');
        tmp.fillStyle = fillColor;
        tmp.fillRect(0,0,1,1);
        const fc = tmp.getImageData(0,0,1,1).data;
        if (tr === fc[0] && tg === fc[1] && tb === fc[2]) return;

        const stack = [[x, y]];
        const match = (i) => data[i]===tr && data[i+1]===tg && data[i+2]===tb && Math.abs(data[i+3]-ta)<10;

        while (stack.length) {
            const [cx, cy] = stack.pop();
            const ci = (cy * w + cx) * 4;
            if (cx < 0 || cx >= w || cy < 0 || cy >= h || !match(ci)) continue;
            data[ci] = fc[0]; data[ci+1] = fc[1]; data[ci+2] = fc[2]; data[ci+3] = 255;
            stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
        }
        this.ctx.putImageData(imgData, 0, 0);
    },

    _renderPalette() {
        const colors = ['#000','#fff','#c00','#f00','#f90','#ff0','#0c0','#0f0','#09f','#00f','#90f','#f0f','#840','#888','#ccc','#fcc'];
        document.getElementById('pt-palette').innerHTML = colors.map(c =>
            `<div class="pt-palswatch" style="background:${c}" onclick="Apps.Paint.color='${c}';document.getElementById('pt-color').value='${c}'"></div>`
        ).join('');
    },
};
