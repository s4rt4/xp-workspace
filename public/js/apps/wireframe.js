/**
 * Wireframe Builder — Drag-drop UI components to build mockups
 */
Apps.Wireframe = {
    _components: [],
    _selected: null,
    _counter: 0,
    _dragState: null,
    _resizeState: null,

    componentTypes: [
        { type: 'button',   label: 'Button',   w: 120, h: 32,  html: '<div style="background:#ece9d8;border:2px outset #fff;padding:4px 16px;text-align:center;font-size:11px;cursor:default">Button</div>' },
        { type: 'input',    label: 'Input',     w: 200, h: 28,  html: '<div style="background:#fff;border:2px inset #888;padding:4px 6px;font-size:11px;color:#888">Text input...</div>' },
        { type: 'textarea', label: 'Textarea',  w: 220, h: 80,  html: '<div style="background:#fff;border:2px inset #888;padding:4px;font-size:10px;color:#888;height:100%">Textarea content...</div>' },
        { type: 'select',   label: 'Dropdown',  w: 160, h: 28,  html: '<div style="background:#fff;border:2px inset #888;padding:3px 6px;font-size:11px;display:flex;justify-content:space-between"><span>Select option</span><span>▼</span></div>' },
        { type: 'checkbox', label: 'Checkbox',  w: 120, h: 20,  html: '<div style="font-size:11px;display:flex;align-items:center;gap:4px"><span style="width:13px;height:13px;border:1px solid #888;background:#fff;display:inline-block"></span> Checkbox</div>' },
        { type: 'radio',    label: 'Radio',     w: 120, h: 20,  html: '<div style="font-size:11px;display:flex;align-items:center;gap:4px"><span style="width:13px;height:13px;border:1px solid #888;background:#fff;border-radius:50%;display:inline-block"></span> Radio</div>' },
        { type: 'heading',  label: 'Heading',   w: 300, h: 30,  html: '<div style="font-size:18px;font-weight:bold;color:#003c74">Page Heading</div>' },
        { type: 'text',     label: 'Text',      w: 250, h: 20,  html: '<div style="font-size:11px;color:#333">Lorem ipsum dolor sit amet</div>' },
        { type: 'paragraph',label: 'Paragraph', w: 300, h: 60,  html: '<div style="font-size:11px;color:#666;line-height:1.5">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</div>' },
        { type: 'image',    label: 'Image',     w: 200, h: 150, html: '<div style="background:#eee;border:1px solid #ccc;height:100%;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:11px">🖼 Image Placeholder</div>' },
        { type: 'divider',  label: 'Divider',   w: 300, h: 4,   html: '<div style="border-top:1px solid #d4d0c8;height:0;margin:1px 0"></div>' },
        { type: 'navbar',   label: 'Navbar',    w: 500, h: 36,  html: '<div style="background:#003c74;color:#fff;padding:8px 12px;font-size:11px;display:flex;gap:16px;align-items:center"><strong>Logo</strong><span>Home</span><span>About</span><span>Contact</span></div>' },
        { type: 'card',     label: 'Card',      w: 220, h: 140, html: '<div style="background:#fff;border:1px solid #d4d0c8;border-radius:4px;overflow:hidden"><div style="background:#eee;height:60px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:10px">Image</div><div style="padding:8px;font-size:11px"><strong>Card Title</strong><div style="color:#888;font-size:10px;margin-top:2px">Card description text here</div></div></div>' },
        { type: 'avatar',   label: 'Avatar',    w: 48,  h: 48,  html: '<div style="width:48px;height:48px;border-radius:50%;background:#ccc;display:flex;align-items:center;justify-content:center;font-size:18px;color:#888">👤</div>' },
        { type: 'badge',    label: 'Badge',     w: 60,  h: 22,  html: '<div style="background:#316ac5;color:#fff;padding:2px 10px;border-radius:10px;font-size:10px;text-align:center">Badge</div>' },
        { type: 'table',    label: 'Table',     w: 350, h: 100, html: '<table style="width:100%;border-collapse:collapse;font-size:10px"><tr style="background:#ece9d8"><th style="border:1px solid #ccc;padding:3px 6px">Column 1</th><th style="border:1px solid #ccc;padding:3px 6px">Column 2</th><th style="border:1px solid #ccc;padding:3px 6px">Column 3</th></tr><tr><td style="border:1px solid #ccc;padding:3px 6px">Data</td><td style="border:1px solid #ccc;padding:3px 6px">Data</td><td style="border:1px solid #ccc;padding:3px 6px">Data</td></tr><tr><td style="border:1px solid #ccc;padding:3px 6px">Data</td><td style="border:1px solid #ccc;padding:3px 6px">Data</td><td style="border:1px solid #ccc;padding:3px 6px">Data</td></tr></table>' },
    ],

    open() {
        if (XP.windows['wireframe']) { XP.focusWindow('wireframe'); return; }

        const compBtns = this.componentTypes.map(c =>
            `<div class="wf-comp-btn" draggable="false" onmousedown="Apps.Wireframe.addComponent('${c.type}', event)">${c.label}</div>`
        ).join('');

        XP.createWindow('wireframe', {
            title: 'Wireframe Builder',
            icon: 'display-properties.png',
            width: 950, height: 600,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Wireframe.clearAll()"><img src="${ICON_PATH}/delete.png" style="width:16px;height:16px" alt=""> Clear</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Wireframe.exportPNG()"><img src="${ICON_PATH}/save.png" style="width:16px;height:16px" alt=""> Export PNG</button>
                <button class="toolbar-btn" onclick="Apps.Wireframe.exportHTML()">Export HTML</button>
            `,
            statusbar: '<span id="wf-status">Drag components from the panel to the canvas</span>',
            content: `
                <style>
                    .wf-wrap{display:flex;height:100%}
                    .wf-panel{width:140px;background:#f5f3e8;border-right:1px solid #d4d0c8;overflow-y:auto;padding:4px;flex-shrink:0}
                    .wf-panel-title{font-size:9px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:bold;padding:4px;margin-bottom:2px}
                    .wf-comp-btn{padding:4px 8px;font-size:10px;cursor:grab;border:1px solid #d4d0c8;background:#fff;margin-bottom:2px;border-radius:2px;user-select:none}
                    .wf-comp-btn:hover{background:#e8f0fe;border-color:#316ac5}
                    .wf-canvas-wrap{flex:1;overflow:auto;background:#808080;padding:20px;display:flex;justify-content:center}
                    .wf-canvas{width:800px;min-height:600px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);position:relative;overflow:hidden}
                    .wf-elem{position:absolute;cursor:move;user-select:none;outline:1px dashed transparent}
                    .wf-elem:hover{outline-color:#316ac5}
                    .wf-elem.selected{outline:2px solid #316ac5}
                    .wf-elem .wf-resize{position:absolute;right:-4px;bottom:-4px;width:8px;height:8px;background:#316ac5;cursor:se-resize;border-radius:2px;display:none}
                    .wf-elem.selected .wf-resize{display:block}
                    .wf-props{width:180px;background:#f5f3e8;border-left:1px solid #d4d0c8;overflow-y:auto;padding:8px;font-size:10px;flex-shrink:0}
                    .wf-props h4{font-size:9px;color:#666;text-transform:uppercase;margin:8px 0 4px}
                    .wf-props h4:first-child{margin-top:0}
                    .wf-prop-row{margin:3px 0}
                    .wf-prop-row label{display:block;color:#888;font-size:9px;margin-bottom:1px}
                    .wf-prop-row input,.wf-prop-row select{width:100%;font-size:10px}
                </style>
                <div class="wf-wrap">
                    <div class="wf-panel">
                        <div class="wf-panel-title">Components</div>
                        ${compBtns}
                    </div>
                    <div class="wf-canvas-wrap">
                        <div class="wf-canvas" id="wf-canvas" onclick="Apps.Wireframe._canvasClick(event)"></div>
                    </div>
                    <div class="wf-props" id="wf-props">
                        <h4>Properties</h4>
                        <div style="color:#888;padding:4px">Select an element</div>
                    </div>
                </div>
            `,
            onReady: () => {
                this._components = [];
                this._counter = 0;
                this._initGlobalEvents();
            },
        });
    },

    addComponent(type, e) {
        const def = this.componentTypes.find(c => c.type === type);
        if (!def) return;
        const id = 'wf-' + (++this._counter);
        const comp = { id, type, x: 20 + this._counter * 10, y: 20 + this._counter * 10, w: def.w, h: def.h, html: def.html, label: def.label + ' ' + this._counter };
        this._components.push(comp);
        this._renderComponent(comp);
        this._select(id);
    },

    _renderComponent(comp) {
        const canvas = document.getElementById('wf-canvas');
        if (!canvas) return;
        let el = document.getElementById(comp.id);
        if (!el) {
            el = document.createElement('div');
            el.className = 'wf-elem';
            el.id = comp.id;
            canvas.appendChild(el);
        }
        el.style.left = comp.x + 'px';
        el.style.top = comp.y + 'px';
        el.style.width = comp.w + 'px';
        el.style.height = comp.h + 'px';
        el.innerHTML = comp.html + '<div class="wf-resize"></div>';
        el.onmousedown = (e) => this._elemDown(comp.id, e);
    },

    _elemDown(id, e) {
        e.stopPropagation();
        const comp = this._components.find(c => c.id === id);
        if (!comp) return;
        this._select(id);

        if (e.target.classList.contains('wf-resize')) {
            this._resizeState = { id, startX: e.clientX, startY: e.clientY, origW: comp.w, origH: comp.h };
        } else {
            this._dragState = { id, startX: e.clientX, startY: e.clientY, origX: comp.x, origY: comp.y };
        }
        e.preventDefault();
    },

    _canvasClick(e) {
        if (e.target.id === 'wf-canvas') this._select(null);
    },

    _select(id) {
        this._selected = id;
        document.querySelectorAll('.wf-elem').forEach(e => e.classList.remove('selected'));
        if (id) document.getElementById(id)?.classList.add('selected');
        this._renderProps();
    },

    _renderProps() {
        const el = document.getElementById('wf-props');
        if (!el) return;
        const comp = this._components.find(c => c.id === this._selected);
        if (!comp) {
            el.innerHTML = '<h4>Properties</h4><div style="color:#888;padding:4px">Select an element</div>';
            return;
        }
        el.innerHTML = `
            <h4>Properties</h4>
            <div class="wf-prop-row"><label>Type</label><input class="xp-input" value="${comp.type}" readonly></div>
            <div class="wf-prop-row"><label>X</label><input class="xp-input" type="number" value="${comp.x}" onchange="Apps.Wireframe._setProp('x',+this.value)"></div>
            <div class="wf-prop-row"><label>Y</label><input class="xp-input" type="number" value="${comp.y}" onchange="Apps.Wireframe._setProp('y',+this.value)"></div>
            <div class="wf-prop-row"><label>Width</label><input class="xp-input" type="number" value="${comp.w}" onchange="Apps.Wireframe._setProp('w',+this.value)"></div>
            <div class="wf-prop-row"><label>Height</label><input class="xp-input" type="number" value="${comp.h}" onchange="Apps.Wireframe._setProp('h',+this.value)"></div>
            <h4>Actions</h4>
            <button class="xp-btn" style="width:100%;font-size:10px;margin:2px 0" onclick="Apps.Wireframe._duplicate()">Duplicate</button>
            <button class="xp-btn" style="width:100%;font-size:10px;margin:2px 0" onclick="Apps.Wireframe._deleteSelected()">Delete</button>
        `;
    },

    _setProp(prop, val) {
        const comp = this._components.find(c => c.id === this._selected);
        if (!comp) return;
        comp[prop] = val;
        this._renderComponent(comp);
    },

    _duplicate() {
        const comp = this._components.find(c => c.id === this._selected);
        if (!comp) return;
        const id = 'wf-' + (++this._counter);
        const clone = { ...comp, id, x: comp.x + 15, y: comp.y + 15, label: comp.label + ' copy' };
        this._components.push(clone);
        this._renderComponent(clone);
        this._select(id);
    },

    _deleteSelected() {
        if (!this._selected) return;
        document.getElementById(this._selected)?.remove();
        this._components = this._components.filter(c => c.id !== this._selected);
        this._selected = null;
        this._renderProps();
    },

    clearAll() {
        this._components.forEach(c => document.getElementById(c.id)?.remove());
        this._components = [];
        this._selected = null;
        this._renderProps();
    },

    _initGlobalEvents() {
        const handler = (e) => {
            if (!document.getElementById('window-wireframe')) { document.removeEventListener('mousemove', handler); return; }
            if (this._dragState) {
                const d = this._dragState;
                const comp = this._components.find(c => c.id === d.id);
                if (comp) {
                    comp.x = Math.max(0, d.origX + e.clientX - d.startX);
                    comp.y = Math.max(0, d.origY + e.clientY - d.startY);
                    const el = document.getElementById(d.id);
                    if (el) { el.style.left = comp.x + 'px'; el.style.top = comp.y + 'px'; }
                }
            }
            if (this._resizeState) {
                const r = this._resizeState;
                const comp = this._components.find(c => c.id === r.id);
                if (comp) {
                    comp.w = Math.max(20, r.origW + e.clientX - r.startX);
                    comp.h = Math.max(10, r.origH + e.clientY - r.startY);
                    const el = document.getElementById(r.id);
                    if (el) { el.style.width = comp.w + 'px'; el.style.height = comp.h + 'px'; }
                }
            }
        };
        document.addEventListener('mousemove', handler);
        document.addEventListener('mouseup', () => {
            if (this._dragState || this._resizeState) this._renderProps();
            this._dragState = null;
            this._resizeState = null;
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this._selected && document.getElementById('window-wireframe')) this._deleteSelected();
        });
    },

    exportPNG() {
        const canvas = document.getElementById('wf-canvas');
        if (!canvas) return;
        // Remove selection before export
        document.querySelectorAll('.wf-elem').forEach(e => e.classList.remove('selected'));
        document.querySelectorAll('.wf-resize').forEach(e => e.style.display = 'none');

        import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js')
            .then(m => m.default(canvas, { backgroundColor: '#fff', scale: 2 }))
            .then(c => {
                const a = document.createElement('a');
                a.href = c.toDataURL('image/png');
                a.download = 'wireframe.png';
                a.click();
            })
            .catch(() => {
                // Fallback: simple screenshot via SVG foreignObject
                XP.notify('Wireframe', 'Export requires html2canvas. Try Export HTML instead.');
            })
            .finally(() => {
                if (this._selected) document.getElementById(this._selected)?.classList.add('selected');
                document.querySelectorAll('.wf-resize').forEach(e => e.style.display = '');
            });
    },

    exportHTML() {
        let html = `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><title>Wireframe</title>\n<style>body{margin:0;font-family:Tahoma,sans-serif;position:relative;width:800px;min-height:600px;background:#fff}</style>\n</head><body>\n`;
        this._components.forEach(c => {
            html += `<div style="position:absolute;left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px">${c.html}</div>\n`;
        });
        html += '</body></html>';

        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'wireframe.html';
        a.click();
        URL.revokeObjectURL(a.href);
    },
};
