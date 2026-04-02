/**
 * SVG Editor — Vector graphics editor with shapes, paths, text, layers
 */
Apps.SVGEditor = {
    _selected: null,
    _tool: 'select',
    _color: '#000000',
    _fill: '#3B79E7',
    _strokeWidth: 2,
    _elements: [],
    _drawing: false,
    _startX: 0, _startY: 0,
    _idCounter: 0,
    _history: [],
    _histIdx: -1,

    open() {
        if (XP.windows['svgeditor']) { XP.focusWindow('svgeditor'); return; }

        XP.createWindow('svgeditor', {
            title: 'SVG Editor',
            icon: 'paint.png',
            width: 900, height: 580,
            toolbar: `
                <button class="toolbar-btn active" id="svg-t-select" onclick="Apps.SVGEditor.setTool('select')"><img src="${ICON_PATH}/arrow_r.cur" style="width:16px;height:16px" alt="" onerror="this.parentElement.textContent='⬚'"> Select</button>
                <button class="toolbar-btn" id="svg-t-rect" onclick="Apps.SVGEditor.setTool('rect')">▭ Rect</button>
                <button class="toolbar-btn" id="svg-t-circle" onclick="Apps.SVGEditor.setTool('circle')">◯ Circle</button>
                <button class="toolbar-btn" id="svg-t-line" onclick="Apps.SVGEditor.setTool('line')">╱ Line</button>
                <button class="toolbar-btn" id="svg-t-text" onclick="Apps.SVGEditor.setTool('text')">T Text</button>
                <button class="toolbar-btn" id="svg-t-path" onclick="Apps.SVGEditor.setTool('path')">✏ Path</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.SVGEditor.undo()">↩ Undo</button>
                <button class="toolbar-btn" onclick="Apps.SVGEditor.redo()">↪ Redo</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.SVGEditor.deleteSelected()"><img src="${ICON_PATH}/delete.png" style="width:16px;height:16px" alt=""> Del</button>
                <button class="toolbar-btn" onclick="Apps.SVGEditor.exportSVG()"><img src="${ICON_PATH}/save.png" style="width:16px;height:16px" alt=""> Export</button>
            `,
            statusbar: '<span id="svg-status">Select tool — Click and drag to draw</span>',
            content: `
                <style>
                    .svg-wrap{display:flex;height:100%}
                    .svg-sidebar{width:180px;background:#f5f3e8;border-right:1px solid #d4d0c8;overflow-y:auto;padding:6px;font-size:11px;flex-shrink:0}
                    .svg-sidebar h4{font-size:10px;color:#666;margin:8px 0 4px;text-transform:uppercase;border-bottom:1px solid #d4d0c8;padding-bottom:2px}
                    .svg-sidebar h4:first-child{margin-top:0}
                    .svg-prop-row{display:flex;align-items:center;gap:4px;margin:3px 0}
                    .svg-prop-row label{width:45px;color:#666;font-size:10px}
                    .svg-prop-row input,.svg-prop-row select{flex:1;font-size:10px}
                    .svg-prop-row input[type=color]{width:28px;height:20px;padding:0;flex:none;cursor:pointer}
                    .svg-prop-row input[type=range]{flex:1}
                    .svg-layers{margin-top:4px}
                    .svg-layer{display:flex;align-items:center;gap:4px;padding:3px 4px;cursor:pointer;border-radius:2px;font-size:10px}
                    .svg-layer:hover{background:#e8f0fe}
                    .svg-layer.active{background:#316ac5;color:#fff}
                    .svg-layer-vis{cursor:pointer;font-size:12px}
                    .svg-canvas-wrap{flex:1;overflow:auto;background:#808080;display:flex;align-items:center;justify-content:center;padding:20px}
                    .svg-canvas-area{background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);position:relative}
                    .svg-canvas-area svg{display:block}
                    .svg-canvas-area svg .svg-selected{outline:2px dashed #316ac5;outline-offset:2px}
                </style>
                <div class="svg-wrap">
                    <div class="svg-sidebar">
                        <h4>Properties</h4>
                        <div class="svg-prop-row"><label>Fill</label><input type="color" id="svg-fill" value="#3B79E7" oninput="Apps.SVGEditor._fill=this.value;Apps.SVGEditor._applyProp('fill',this.value)"></div>
                        <div class="svg-prop-row"><label>Stroke</label><input type="color" id="svg-stroke" value="#000000" oninput="Apps.SVGEditor._color=this.value;Apps.SVGEditor._applyProp('stroke',this.value)"></div>
                        <div class="svg-prop-row"><label>Width</label><input type="range" id="svg-sw" min="0" max="20" value="2" oninput="Apps.SVGEditor._strokeWidth=+this.value;Apps.SVGEditor._applyProp('stroke-width',this.value);document.getElementById('svg-sw-val').textContent=this.value"><span id="svg-sw-val" style="width:16px">2</span></div>
                        <div class="svg-prop-row"><label>Opacity</label><input type="range" id="svg-opa" min="0" max="100" value="100" oninput="Apps.SVGEditor._applyProp('opacity',this.value/100);document.getElementById('svg-opa-val').textContent=this.value+'%'"><span id="svg-opa-val" style="width:28px">100%</span></div>

                        <h4>Layers</h4>
                        <div class="svg-layers" id="svg-layers"></div>
                        <div style="display:flex;gap:2px;margin-top:4px">
                            <button class="xp-btn" style="font-size:9px;padding:1px 6px;min-width:0;min-height:0;box-shadow:none" onclick="Apps.SVGEditor._moveLayer(-1)">↑</button>
                            <button class="xp-btn" style="font-size:9px;padding:1px 6px;min-width:0;min-height:0;box-shadow:none" onclick="Apps.SVGEditor._moveLayer(1)">↓</button>
                            <button class="xp-btn" style="font-size:9px;padding:1px 6px;min-width:0;min-height:0;box-shadow:none" onclick="Apps.SVGEditor._duplicateSelected()">⧉</button>
                        </div>
                    </div>
                    <div class="svg-canvas-wrap">
                        <div class="svg-canvas-area" id="svg-canvas-area">
                            <svg id="svg-canvas" width="640" height="480" xmlns="http://www.w3.org/2000/svg" style="cursor:crosshair"></svg>
                        </div>
                    </div>
                </div>
            `,
            onReady: () => this._initCanvas(),
        });
    },

    _initCanvas() {
        const svg = document.getElementById('svg-canvas');
        if (!svg) return;
        // Background rect
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%');
        bg.setAttribute('fill', '#ffffff'); bg.id = 'svg-bg';
        svg.appendChild(bg);

        svg.addEventListener('mousedown', (e) => this._onDown(e));
        svg.addEventListener('mousemove', (e) => this._onMove(e));
        svg.addEventListener('mouseup', (e) => this._onUp(e));
        this._saveHistory();
        this._renderLayers();
    },

    _getPos(e) {
        const svg = document.getElementById('svg-canvas');
        const rect = svg.getBoundingClientRect();
        return [e.clientX - rect.left, e.clientY - rect.top];
    },

    setTool(t) {
        this._tool = t;
        document.querySelectorAll('[id^="svg-t-"]').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById('svg-t-' + t);
        if (btn) btn.classList.add('active');
        const svg = document.getElementById('svg-canvas');
        if (svg) svg.style.cursor = t === 'select' ? 'default' : 'crosshair';
        document.getElementById('svg-status').textContent = t.charAt(0).toUpperCase() + t.slice(1) + ' tool';
    },

    _onDown(e) {
        const [x, y] = this._getPos(e);
        this._startX = x; this._startY = y;

        if (this._tool === 'select') {
            const target = e.target.closest('[data-sid]');
            this._selectElement(target ? target.dataset.sid : null);
            if (target) { this._dragging = { sid: target.dataset.sid, ox: x, oy: y, el: target }; }
            return;
        }

        if (this._tool === 'text') {
            const text = prompt('Enter text:', 'Hello');
            if (!text) return;
            this._addElement('text', { x, y, text, fill: this._fill, 'font-size': 20, 'font-family': 'Arial' });
            return;
        }

        this._drawing = true;
        const svg = document.getElementById('svg-canvas');
        const ns = 'http://www.w3.org/2000/svg';

        if (this._tool === 'path') {
            if (!this._pathPoints) {
                this._pathPoints = [[x, y]];
                const path = document.createElementNS(ns, 'path');
                path.setAttribute('d', `M${x},${y}`);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', this._color);
                path.setAttribute('stroke-width', this._strokeWidth);
                path.id = 'svg-temp-path';
                svg.appendChild(path);
            } else {
                this._pathPoints.push([x, y]);
                const d = 'M' + this._pathPoints.map(p => p.join(',')).join(' L');
                document.getElementById('svg-temp-path')?.setAttribute('d', d);
            }
            return;
        }

        // Create temp element
        let el;
        if (this._tool === 'rect') {
            el = document.createElementNS(ns, 'rect');
            el.setAttribute('x', x); el.setAttribute('y', y);
            el.setAttribute('width', 0); el.setAttribute('height', 0);
            el.setAttribute('fill', this._fill);
            el.setAttribute('stroke', this._color);
            el.setAttribute('stroke-width', this._strokeWidth);
        } else if (this._tool === 'circle') {
            el = document.createElementNS(ns, 'ellipse');
            el.setAttribute('cx', x); el.setAttribute('cy', y);
            el.setAttribute('rx', 0); el.setAttribute('ry', 0);
            el.setAttribute('fill', this._fill);
            el.setAttribute('stroke', this._color);
            el.setAttribute('stroke-width', this._strokeWidth);
        } else if (this._tool === 'line') {
            el = document.createElementNS(ns, 'line');
            el.setAttribute('x1', x); el.setAttribute('y1', y);
            el.setAttribute('x2', x); el.setAttribute('y2', y);
            el.setAttribute('stroke', this._color);
            el.setAttribute('stroke-width', this._strokeWidth);
        }
        if (el) { el.id = 'svg-temp'; svg.appendChild(el); }
    },

    _onMove(e) {
        const [x, y] = this._getPos(e);

        // Drag selected
        if (this._dragging) {
            const d = this._dragging;
            const dx = x - d.ox, dy = y - d.oy;
            const el = d.el;
            if (el.tagName === 'rect' || el.tagName === 'text' || el.tagName === 'image') {
                el.setAttribute('x', parseFloat(el.getAttribute('x')) + dx);
                el.setAttribute('y', parseFloat(el.getAttribute('y')) + dy);
            } else if (el.tagName === 'ellipse' || el.tagName === 'circle') {
                el.setAttribute('cx', parseFloat(el.getAttribute('cx')) + dx);
                el.setAttribute('cy', parseFloat(el.getAttribute('cy')) + dy);
            } else if (el.tagName === 'line') {
                el.setAttribute('x1', parseFloat(el.getAttribute('x1')) + dx);
                el.setAttribute('y1', parseFloat(el.getAttribute('y1')) + dy);
                el.setAttribute('x2', parseFloat(el.getAttribute('x2')) + dx);
                el.setAttribute('y2', parseFloat(el.getAttribute('y2')) + dy);
            } else if (el.tagName === 'path') {
                let transform = el.getAttribute('transform') || '';
                const m = transform.match(/translate\(([^)]+)\)/);
                let tx = 0, ty = 0;
                if (m) { [tx, ty] = m[1].split(',').map(Number); }
                el.setAttribute('transform', `translate(${tx + dx},${ty + dy})`);
            }
            d.ox = x; d.oy = y;
            return;
        }

        if (!this._drawing) return;
        const tmp = document.getElementById('svg-temp');
        if (!tmp) return;

        if (this._tool === 'rect') {
            const w = x - this._startX, h = y - this._startY;
            tmp.setAttribute('x', w < 0 ? x : this._startX);
            tmp.setAttribute('y', h < 0 ? y : this._startY);
            tmp.setAttribute('width', Math.abs(w));
            tmp.setAttribute('height', Math.abs(h));
        } else if (this._tool === 'circle') {
            tmp.setAttribute('rx', Math.abs(x - this._startX) / 2);
            tmp.setAttribute('ry', Math.abs(y - this._startY) / 2);
            tmp.setAttribute('cx', (this._startX + x) / 2);
            tmp.setAttribute('cy', (this._startY + y) / 2);
        } else if (this._tool === 'line') {
            tmp.setAttribute('x2', x); tmp.setAttribute('y2', y);
        }
    },

    _onUp(e) {
        if (this._dragging) {
            this._dragging = null;
            this._saveHistory();
            return;
        }
        if (!this._drawing) return;
        this._drawing = false;

        const tmp = document.getElementById('svg-temp');
        if (tmp) {
            const sid = 'el-' + (++this._idCounter);
            tmp.removeAttribute('id');
            tmp.setAttribute('data-sid', sid);
            const name = this._tool.charAt(0).toUpperCase() + this._tool.slice(1);
            this._elements.push({ sid, type: this._tool, name: name + ' ' + this._idCounter });
            this._selectElement(sid);
            this._saveHistory();
            this._renderLayers();
        }
    },

    // Finish path on double-click or Escape
    finishPath() {
        const tmp = document.getElementById('svg-temp-path');
        if (tmp && this._pathPoints) {
            const sid = 'el-' + (++this._idCounter);
            tmp.removeAttribute('id');
            tmp.setAttribute('data-sid', sid);
            this._elements.push({ sid, type: 'path', name: 'Path ' + this._idCounter });
            this._pathPoints = null;
            this._drawing = false;
            this._selectElement(sid);
            this._saveHistory();
            this._renderLayers();
        }
    },

    _addElement(type, attrs) {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.getElementById('svg-canvas');
        let el;
        if (type === 'text') {
            el = document.createElementNS(ns, 'text');
            el.textContent = attrs.text || 'Text';
            delete attrs.text;
        } else {
            el = document.createElementNS(ns, type);
        }
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        const sid = 'el-' + (++this._idCounter);
        el.setAttribute('data-sid', sid);
        svg.appendChild(el);
        this._elements.push({ sid, type, name: type.charAt(0).toUpperCase() + type.slice(1) + ' ' + this._idCounter });
        this._selectElement(sid);
        this._saveHistory();
        this._renderLayers();
    },

    _selectElement(sid) {
        document.querySelectorAll('.svg-selected').forEach(e => e.classList.remove('svg-selected'));
        this._selected = sid;
        if (sid) {
            const el = document.querySelector(`[data-sid="${sid}"]`);
            if (el) el.classList.add('svg-selected');
        }
        this._renderLayers();
    },

    _applyProp(prop, value) {
        if (!this._selected) return;
        const el = document.querySelector(`[data-sid="${this._selected}"]`);
        if (el) { el.setAttribute(prop, value); this._saveHistory(); }
    },

    deleteSelected() {
        if (!this._selected) return;
        document.querySelector(`[data-sid="${this._selected}"]`)?.remove();
        this._elements = this._elements.filter(e => e.sid !== this._selected);
        this._selected = null;
        this._saveHistory();
        this._renderLayers();
    },

    _duplicateSelected() {
        if (!this._selected) return;
        const el = document.querySelector(`[data-sid="${this._selected}"]`);
        if (!el) return;
        const clone = el.cloneNode(true);
        const sid = 'el-' + (++this._idCounter);
        clone.setAttribute('data-sid', sid);
        // Offset position
        if (clone.getAttribute('x')) clone.setAttribute('x', parseFloat(clone.getAttribute('x')) + 10);
        if (clone.getAttribute('y')) clone.setAttribute('y', parseFloat(clone.getAttribute('y')) + 10);
        if (clone.getAttribute('cx')) clone.setAttribute('cx', parseFloat(clone.getAttribute('cx')) + 10);
        if (clone.getAttribute('cy')) clone.setAttribute('cy', parseFloat(clone.getAttribute('cy')) + 10);
        document.getElementById('svg-canvas').appendChild(clone);
        const orig = this._elements.find(e => e.sid === this._selected);
        this._elements.push({ sid, type: orig?.type || 'shape', name: (orig?.name || 'Copy') + ' copy' });
        this._selectElement(sid);
        this._saveHistory();
        this._renderLayers();
    },

    _moveLayer(dir) {
        if (!this._selected) return;
        const idx = this._elements.findIndex(e => e.sid === this._selected);
        if (idx === -1) return;
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= this._elements.length) return;
        [this._elements[idx], this._elements[newIdx]] = [this._elements[newIdx], this._elements[idx]];

        // Reorder SVG elements
        const svg = document.getElementById('svg-canvas');
        const bg = document.getElementById('svg-bg');
        this._elements.forEach(e => {
            const el = document.querySelector(`[data-sid="${e.sid}"]`);
            if (el) svg.appendChild(el);
        });
        this._saveHistory();
        this._renderLayers();
    },

    _renderLayers() {
        const el = document.getElementById('svg-layers');
        if (!el) return;
        el.innerHTML = this._elements.slice().reverse().map(e =>
            `<div class="svg-layer ${e.sid === this._selected ? 'active' : ''}" onclick="Apps.SVGEditor._selectElement('${e.sid}')">
                <span>${e.type === 'rect' ? '▭' : e.type === 'circle' || e.type === 'ellipse' ? '◯' : e.type === 'line' ? '╱' : e.type === 'text' ? 'T' : '✏'}</span>
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis">${e.name}</span>
            </div>`
        ).join('') || '<div style="color:#888;padding:4px;font-size:10px">No elements</div>';
    },

    // History
    _saveHistory() {
        const svg = document.getElementById('svg-canvas');
        if (!svg) return;
        this._histIdx++;
        this._history = this._history.slice(0, this._histIdx);
        this._history.push({ html: svg.innerHTML, elements: JSON.parse(JSON.stringify(this._elements)) });
        if (this._history.length > 40) { this._history.shift(); this._histIdx--; }
    },

    undo() {
        if (this._histIdx <= 0) return;
        this._histIdx--;
        this._restoreHistory();
    },

    redo() {
        if (this._histIdx >= this._history.length - 1) return;
        this._histIdx++;
        this._restoreHistory();
    },

    _restoreHistory() {
        const svg = document.getElementById('svg-canvas');
        const state = this._history[this._histIdx];
        if (!svg || !state) return;
        svg.innerHTML = state.html;
        this._elements = JSON.parse(JSON.stringify(state.elements));
        this._selected = null;
        this._renderLayers();
    },

    exportSVG() {
        const svg = document.getElementById('svg-canvas');
        if (!svg) return;
        // Remove selection class before export
        document.querySelectorAll('.svg-selected').forEach(e => e.classList.remove('svg-selected'));
        const data = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'drawing.svg';
        a.click();
        URL.revokeObjectURL(a.href);
        document.getElementById('svg-status').textContent = 'Exported as SVG';
    },
};

// Finish path on Escape or double-click
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && Apps.SVGEditor._pathPoints) Apps.SVGEditor.finishPath();
    if (e.key === 'Delete' && Apps.SVGEditor._selected && document.getElementById('window-svgeditor')) Apps.SVGEditor.deleteSelected();
});
document.addEventListener('dblclick', (e) => {
    if (e.target.closest('#svg-canvas') && Apps.SVGEditor._pathPoints) Apps.SVGEditor.finishPath();
});
