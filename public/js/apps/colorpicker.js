/**
 * Color Picker — Pick colors, convert formats, generate palettes
 */
Apps.ColorPicker = {
    open() {
        if (XP.windows['colorpicker']) { XP.focusWindow('colorpicker'); return; }

        XP.createWindow('colorpicker', {
            title: 'Color Picker',
            icon: 'color-profile.png',
            width: 420, height: 460,
            resizable: false,
            content: `
                <style>
                    .cp-wrap { padding:10px; }
                    .cp-main { display:flex; gap:12px; margin-bottom:12px; }
                    .cp-preview { width:80px; height:80px; border:2px solid #808080; border-radius:4px; box-shadow:inset 0 0 0 1px #fff; }
                    .cp-inputs { flex:1; }
                    .cp-row { display:flex; align-items:center; gap:6px; margin-bottom:5px; font-size:11px; }
                    .cp-row label { width:32px; font-weight:bold; color:#444; }
                    .cp-row input[type=text] { flex:1; font-family:Consolas,monospace; font-size:11px; }
                    .cp-row input[type=range] { flex:1; }
                    .cp-row input[type=color] { width:28px; height:22px; border:1px solid #808080; padding:0; cursor:pointer; }
                    .cp-section { font-size:10px; font-weight:bold; color:#666; margin:10px 0 4px; border-bottom:1px solid #d4d0c8; padding-bottom:2px; }
                    .cp-palette { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
                    .cp-swatch { width:28px; height:28px; border:1px solid #808080; border-radius:2px; cursor:pointer; transition:transform .1s; }
                    .cp-swatch:hover { transform:scale(1.2); z-index:1; }
                    .cp-palette-row { display:flex; gap:4px; margin-bottom:4px; }
                    .cp-gen-btns { display:flex; gap:4px; margin-top:6px; }
                    .cp-gen-btns button { font-size:10px; padding:2px 8px; }
                    .cp-copy-msg { font-size:10px; color:#27ae60; margin-left:8px; opacity:0; transition:opacity .3s; }
                    .cp-copy-msg.show { opacity:1; }
                </style>
                <div class="cp-wrap">
                    <div class="cp-main">
                        <div>
                            <div class="cp-preview" id="cp-preview" style="background:#3B79E7"></div>
                            <input type="color" id="cp-native" value="#3B79E7" style="width:80px;margin-top:4px" oninput="Apps.ColorPicker.fromHex(this.value)">
                        </div>
                        <div class="cp-inputs">
                            <div class="cp-row">
                                <label>HEX</label>
                                <input class="xp-input" type="text" id="cp-hex" value="#3B79E7" onchange="Apps.ColorPicker.fromHex(this.value)" onclick="Apps.ColorPicker.copyVal(this)">
                                <span class="cp-copy-msg" id="cp-copy-msg">Copied!</span>
                            </div>
                            <div class="cp-row">
                                <label>RGB</label>
                                <input class="xp-input" type="text" id="cp-rgb" value="rgb(59, 121, 231)" readonly onclick="Apps.ColorPicker.copyVal(this)">
                            </div>
                            <div class="cp-row">
                                <label>HSL</label>
                                <input class="xp-input" type="text" id="cp-hsl" value="hsl(218, 78%, 57%)" readonly onclick="Apps.ColorPicker.copyVal(this)">
                            </div>
                            <div class="cp-row">
                                <label>R</label><input type="range" id="cp-r" min="0" max="255" value="59" oninput="Apps.ColorPicker.fromSliders()">
                                <span style="width:24px;text-align:right" id="cp-rv">59</span>
                            </div>
                            <div class="cp-row">
                                <label>G</label><input type="range" id="cp-g" min="0" max="255" value="121" oninput="Apps.ColorPicker.fromSliders()">
                                <span style="width:24px;text-align:right" id="cp-gv">121</span>
                            </div>
                            <div class="cp-row">
                                <label>B</label><input type="range" id="cp-b" min="0" max="255" value="231" oninput="Apps.ColorPicker.fromSliders()">
                                <span style="width:24px;text-align:right" id="cp-bv">231</span>
                            </div>
                        </div>
                    </div>

                    <div class="cp-section">PALETTE GENERATOR</div>
                    <div class="cp-gen-btns">
                        <button class="xp-btn" onclick="Apps.ColorPicker.genShades()">Shades</button>
                        <button class="xp-btn" onclick="Apps.ColorPicker.genTints()">Tints</button>
                        <button class="xp-btn" onclick="Apps.ColorPicker.genComplement()">Complementary</button>
                        <button class="xp-btn" onclick="Apps.ColorPicker.genAnalogous()">Analogous</button>
                    </div>
                    <div class="cp-palette" id="cp-palette"></div>

                    <div class="cp-section">COMMON COLORS</div>
                    <div class="cp-palette" id="cp-common"></div>
                </div>
            `,
            onReady: () => {
                this._renderCommon();
                this.genShades();
            },
        });
    },

    fromHex(hex) {
        hex = hex.trim();
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (!/^#[0-9a-fA-F]{3,8}$/.test(hex)) return;
        // Expand shorthand
        if (hex.length === 4) hex = '#' + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
        const r = parseInt(hex.substr(1,2),16), g = parseInt(hex.substr(3,2),16), b = parseInt(hex.substr(5,2),16);
        this._update(r, g, b);
    },

    fromSliders() {
        const r = parseInt(document.getElementById('cp-r').value);
        const g = parseInt(document.getElementById('cp-g').value);
        const b = parseInt(document.getElementById('cp-b').value);
        this._update(r, g, b);
    },

    _update(r, g, b) {
        const hex = '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('').toUpperCase();
        const [h, s, l] = this._rgbToHsl(r, g, b);

        document.getElementById('cp-preview').style.background = hex;
        document.getElementById('cp-native').value = hex;
        document.getElementById('cp-hex').value = hex;
        document.getElementById('cp-rgb').value = `rgb(${r}, ${g}, ${b})`;
        document.getElementById('cp-hsl').value = `hsl(${h}, ${s}%, ${l}%)`;
        document.getElementById('cp-r').value = r; document.getElementById('cp-rv').textContent = r;
        document.getElementById('cp-g').value = g; document.getElementById('cp-gv').textContent = g;
        document.getElementById('cp-b').value = b; document.getElementById('cp-bv').textContent = b;
    },

    _rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r,g,b), min = Math.min(r,g,b);
        let h, s, l = (max+min)/2;
        if (max === min) { h = s = 0; }
        else {
            const d = max - min;
            s = l > 0.5 ? d/(2-max-min) : d/(max+min);
            switch(max) {
                case r: h = ((g-b)/d + (g<b?6:0))/6; break;
                case g: h = ((b-r)/d + 2)/6; break;
                case b: h = ((r-g)/d + 4)/6; break;
            }
        }
        return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
    },

    _hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            const hue2rgb = (p, q, t) => { if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
            const q = l < 0.5 ? l*(1+s) : l+s-l*s;
            const p = 2*l - q;
            r = hue2rgb(p, q, h+1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h-1/3);
        }
        return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
    },

    _currentRgb() {
        return [parseInt(document.getElementById('cp-r').value), parseInt(document.getElementById('cp-g').value), parseInt(document.getElementById('cp-b').value)];
    },

    _renderPalette(colors) {
        const el = document.getElementById('cp-palette');
        el.innerHTML = colors.map(hex =>
            `<div class="cp-swatch" style="background:${hex}" title="${hex}" onclick="Apps.ColorPicker.fromHex('${hex}')"></div>`
        ).join('');
    },

    genShades() {
        const [r,g,b] = this._currentRgb();
        const colors = [];
        for (let i = 0; i < 10; i++) {
            const f = 1 - i * 0.1;
            colors.push('#' + [r,g,b].map(v => Math.round(v*f).toString(16).padStart(2,'0')).join(''));
        }
        this._renderPalette(colors);
    },

    genTints() {
        const [r,g,b] = this._currentRgb();
        const colors = [];
        for (let i = 0; i < 10; i++) {
            const f = i * 0.1;
            colors.push('#' + [r,g,b].map(v => Math.round(v+(255-v)*f).toString(16).padStart(2,'0')).join(''));
        }
        this._renderPalette(colors);
    },

    genComplement() {
        const [r,g,b] = this._currentRgb();
        const [h,s,l] = this._rgbToHsl(r,g,b);
        const colors = [];
        for (let i = 0; i < 10; i++) {
            const hue = (h + i * 36) % 360;
            const [cr,cg,cb] = this._hslToRgb(hue, s, l);
            colors.push('#' + [cr,cg,cb].map(v => v.toString(16).padStart(2,'0')).join(''));
        }
        this._renderPalette(colors);
    },

    genAnalogous() {
        const [r,g,b] = this._currentRgb();
        const [h,s,l] = this._rgbToHsl(r,g,b);
        const colors = [];
        for (let i = -4; i <= 5; i++) {
            const hue = (h + i * 15 + 360) % 360;
            const [cr,cg,cb] = this._hslToRgb(hue, s, l);
            colors.push('#' + [cr,cg,cb].map(v => v.toString(16).padStart(2,'0')).join(''));
        }
        this._renderPalette(colors);
    },

    copyVal(input) {
        navigator.clipboard.writeText(input.value);
        const msg = document.getElementById('cp-copy-msg');
        if (msg) { msg.classList.add('show'); setTimeout(() => msg.classList.remove('show'), 1200); }
    },

    _renderCommon() {
        const colors = ['#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF',
                         '#C0C0C0','#808080','#800000','#808000','#008000','#800080','#008080','#000080',
                         '#FF6633','#FFB399','#FF33FF','#00B3E6','#E6B333','#3366E6','#999966','#99FF99'];
        document.getElementById('cp-common').innerHTML = colors.map(hex =>
            `<div class="cp-swatch" style="background:${hex}" title="${hex}" onclick="Apps.ColorPicker.fromHex('${hex}')"></div>`
        ).join('');
    },
};
