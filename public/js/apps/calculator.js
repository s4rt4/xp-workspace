/**
 * Calculator App — Basic + 16 Advanced Calculators
 * Merged from kalkulator + kalkulator-v2
 */
Apps.Calculator = {
    mode: 'basic', // 'basic' or 'advanced'

    open() {
        XP.createWindow('calculator', {
            title: 'Calculator',
            icon: 'calculator.png',
            width: 320, height: 420,
            resizable: false,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Calculator.switchMode('basic')" id="calc-mode-basic"><img src="${ICON_PATH}/calculator.png" style="width:16px;height:16px" alt=""> Basic</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Calculator.switchMode('advanced')" id="calc-mode-adv"><img src="${ICON_PATH}/administrative-tools.png" style="width:16px;height:16px" alt=""> Advanced</button>
            `,
            content: '<div id="calc-container"></div>',
            onReady: () => this.switchMode('basic'),
        });
    },

    switchMode(mode) {
        this.mode = mode;
        const el = document.getElementById('calc-container');
        if (!el) return;
        if (mode === 'basic') {
            this.renderBasic(el);
        } else {
            this.renderAdvanced(el);
        }
    },

    // ═══════════════════════════════════════════
    //  BASIC CALCULATOR
    // ═══════════════════════════════════════════
    _b: { curr: '0', prev: '', op: null, justEval: false },

    renderBasic(el) {
        const win = document.getElementById('window-calculator');
        if (win) { win.style.width = '320px'; win.style.height = '420px'; }
        el.innerHTML = `
            <style>
                .calc-screen { background:#001820; color:#fff; padding:8px 12px; text-align:right; border:2px inset #999; margin-bottom:4px; font-family:'Consolas',monospace; }
                .calc-prev { font-size:11px; color:#8fa; min-height:14px; }
                .calc-curr { font-size:22px; font-weight:bold; word-break:break-all; }
                .calc-keys { display:grid; grid-template-columns:repeat(4,1fr); gap:2px; }
                .calc-keys button { font-family:var(--xp-font); font-size:12px; padding:8px 4px; background:var(--xp-btn-face); border:1px solid; border-color:#fff #716f64 #716f64 #fff; cursor:pointer; min-height:32px; min-width:0; box-shadow:none; }
                .calc-keys button:hover { background:#e8e4d8; }
                .calc-keys button:active { border-color:#716f64 #fff #fff #716f64; }
                .calc-keys button.op { background:#e8d8c0; font-weight:bold; }
                .calc-keys button.eq { background:#c8d8e8; font-weight:bold; }
                .calc-keys button.fn { background:#d8e8d8; font-size:11px; }
            </style>
            <div class="calc-screen">
                <div class="calc-prev" id="calc-prev">&nbsp;</div>
                <div class="calc-curr" id="calc-curr">0</div>
            </div>
            <div class="calc-keys" id="calc-keys">
                <button class="fn" data-action="sqrt">√</button>
                <button class="fn" data-action="percent">%</button>
                <button class="fn" data-action="backspace">⌫</button>
                <button class="fn" data-action="clear">C</button>
                <button data-num="7">7</button><button data-num="8">8</button><button data-num="9">9</button><button class="op" data-op="÷">÷</button>
                <button data-num="4">4</button><button data-num="5">5</button><button data-num="6">6</button><button class="op" data-op="×">×</button>
                <button data-num="1">1</button><button data-num="2">2</button><button data-num="3">3</button><button class="op" data-op="-">−</button>
                <button class="fn" data-action="sign">±</button><button data-num="0">0</button><button data-action="dot">.</button><button class="op" data-op="+">+</button>
                <button class="eq" data-action="equals" style="grid-column:span 4">=</button>
            </div>`;
        this._b = { curr: '0', prev: '', op: null, justEval: false };
        document.getElementById('calc-keys').addEventListener('click', (e) => {
            const btn = e.target.closest('button'); if (!btn) return;
            const num = btn.dataset.num, op = btn.dataset.op, act = btn.dataset.action;
            if (num) this._bInputNum(num);
            else if (op) this._bSetOp(op);
            else if (act === 'dot') this._bDot();
            else if (act === 'sign') this._bSign();
            else if (act === 'percent') this._bPercent();
            else if (act === 'sqrt') this._bSqrt();
            else if (act === 'backspace') this._bBackspace();
            else if (act === 'clear') this._bClear();
            else if (act === 'equals') this._bEval();
        });
    },

    _bFmt(s) {
        if (!s || s === '-') return s || '0';
        if (s === '.') return '0.';
        const n = Number(s); if (!isFinite(n)) return 'Error';
        const [i, d] = s.split('.');
        const f = Number(i).toLocaleString();
        return d !== undefined ? `${f}.${d}` : f;
    },
    _bUpdate() {
        const b = this._b;
        document.getElementById('calc-curr').textContent = this._bFmt(b.curr);
        document.getElementById('calc-prev').textContent = b.prev ? `${this._bFmt(b.prev)} ${b.op ?? ''}` : '\u00A0';
    },
    _bInputNum(d) { const b = this._b; if (b.justEval) { b.curr = '0'; b.justEval = false; } if (b.curr.length >= 20) return; b.curr = b.curr === '0' ? d : b.curr + d; this._bUpdate(); },
    _bSetOp(op) { const b = this._b; if (b.op && b.prev && b.curr && !b.justEval) this._bEval(); b.prev = b.curr; b.curr = '0'; b.op = op; b.justEval = false; this._bUpdate(); },
    _bDot() { const b = this._b; if (b.justEval) { b.curr = '0'; b.justEval = false; } if (!b.curr.includes('.')) b.curr += '.'; this._bUpdate(); },
    _bSign() { const b = this._b; if (b.curr === '0') return; b.curr = b.curr.startsWith('-') ? b.curr.slice(1) : '-' + b.curr; this._bUpdate(); },
    _bPercent() { const b = this._b; b.curr = (Number(b.curr) / 100).toString(); this._bUpdate(); },
    _bSqrt() { const b = this._b; const n = Number(b.curr); b.curr = n < 0 ? 'Error' : Math.sqrt(n).toString(); this._bUpdate(); },
    _bBackspace() { const b = this._b; if (b.justEval) return; b.curr = b.curr.length > 1 ? b.curr.slice(0, -1) : '0'; this._bUpdate(); },
    _bClear() { this._b = { curr: '0', prev: '', op: null, justEval: false }; this._bUpdate(); },
    _bEval() {
        const b = this._b; if (!b.op || !b.prev) return;
        const a = Number(b.prev), c = Number(b.curr); let r;
        switch (b.op) { case '+': r = a + c; break; case '-': r = a - c; break; case '×': r = a * c; break; case '÷': r = c === 0 ? NaN : a / c; break; }
        b.curr = isFinite(r) ? `${+r}` : 'Error'; b.prev = ''; b.op = null; b.justEval = true; this._bUpdate();
    },

    // ═══════════════════════════════════════════
    //  ADVANCED CALCULATOR (16 calculators)
    // ═══════════════════════════════════════════
    _advCalcs: {
        volume:     { title: 'Volume', icon: 'cube' },
        luasRuang:  { title: 'Luas Permukaan', icon: 'box' },
        keliling:   { title: 'Keliling', icon: 'square' },
        luasDatar:  { title: 'Luas Datar', icon: 'shapes' },
        berat:      { title: 'Konversi Berat', icon: 'weight' },
        jarak:      { title: 'Konversi Jarak', icon: 'ruler' },
        suhu:       { title: 'Konversi Suhu', icon: 'thermo' },
        uang:       { title: 'Konversi Mata Uang', icon: 'money' },
        pythagoras: { title: 'Pythagoras', icon: 'triangle' },
        persen:     { title: 'Persentase', icon: 'percent' },
        pecahan:    { title: 'Pecahan → Desimal', icon: 'divide' },
        skala:      { title: 'Skala', icon: 'map' },
        waktu:      { title: 'Konversi Waktu', icon: 'clock' },
        kecepatan:  { title: 'Konversi Kecepatan', icon: 'speed' },
        diskon:     { title: 'Diskon', icon: 'tag' },
        cicilan:    { title: 'Cicilan', icon: 'credit' },
    },

    renderAdvanced(el) {
        const win = document.getElementById('window-calculator');
        if (win) { win.style.width = '680px'; win.style.height = '460px'; }

        const menuItems = Object.entries(this._advCalcs).map(([k, v]) =>
            `<div class="adv-menu-item" data-calc="${k}" onclick="Apps.Calculator.showCalc('${k}')">${v.title}</div>`
        ).join('');

        el.innerHTML = `
            <style>
                .adv-layout { display:flex; height:100%; margin:-8px; }
                .adv-sidebar { width:160px; background:#f5f3e8; border-right:1px solid #d4d0c8; overflow-y:auto; flex-shrink:0; padding:2px 0; }
                .adv-menu-item { padding:5px 8px; font-size:11px; cursor:pointer; border:1px solid transparent; }
                .adv-menu-item:hover { background:#e8f0fe; }
                .adv-menu-item.active { background:var(--xp-selection); color:#fff; }
                .adv-body { flex:1; padding:12px; overflow-y:auto; }
                .adv-body h3 { font-size:13px; margin:0 0 10px; color:#003c74; }
                .adv-row { display:flex; gap:8px; margin-bottom:6px; align-items:center; }
                .adv-row label { font-size:11px; min-width:80px; }
                .adv-row input, .adv-row select { font-size:11px; padding:3px 4px; border:1px solid #7f9db9; flex:1; min-width:0; }
                .adv-result { margin-top:10px; padding:8px; background:#f0f8ff; border:1px solid #c8d8e8; font-size:13px; font-weight:bold; color:#003c74; display:none; }
                .adv-err { color:red; font-size:10px; display:none; }
                .adv-err.show { display:block; }
            </style>
            <div class="adv-layout">
                <div class="adv-sidebar" id="adv-sidebar">${menuItems}</div>
                <div class="adv-body" id="adv-body"><div style="text-align:center;padding:40px;color:#999">Select a calculator</div></div>
            </div>`;
        this.showCalc('volume');
    },

    showCalc(id) {
        document.querySelectorAll('.adv-menu-item').forEach(m => m.classList.remove('active'));
        document.querySelector(`.adv-menu-item[data-calc="${id}"]`)?.classList.add('active');
        const body = document.getElementById('adv-body');
        if (!body) return;
        const fn = this['_adv_' + id];
        if (fn) fn.call(this, body);
    },

    // Helpers
    _n(id) { return parseFloat(document.getElementById(id)?.value); },
    _fmt(v, u = '') { const s = parseFloat(v.toFixed(6)).toLocaleString('id-ID'); return s + (u ? ' ' + u : ''); },
    _mkInput(id, label, ph) { return `<div class="adv-row"><label>${label}</label><input type="number" id="${id}" placeholder="${ph}" min="0" class="xp-input"></div>`; },
    _mkSelect(id, label, opts) { return `<div class="adv-row"><label>${label}</label><select id="${id}" class="xp-select">${opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select></div>`; },
    _showRes(el, val) { el.style.display = 'block'; el.textContent = val; },

    // ── Volume ──
    _adv_volume(body) {
        body.innerHTML = `<h3>Volume Bangun Ruang</h3>
            ${this._mkSelect('vol-shape','Bentuk',[['kubus','Kubus'],['balok','Balok'],['bola','Bola'],['tabung','Tabung'],['kerucut','Kerucut']])}
            <div id="vol-fields"></div>
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._calcVol()">Hitung</button>
            <div class="adv-result" id="vol-res"></div>`;
        document.getElementById('vol-shape').onchange = () => this._volFields();
        this._volFields();
    },
    _volFields() {
        const s = document.getElementById('vol-shape').value, f = document.getElementById('vol-fields');
        const cfg = { kubus: [['v-a','Sisi','s']], balok: [['v-p','Panjang','p'],['v-l','Lebar','l'],['v-t','Tinggi','t']], bola: [['v-r','Jari-jari','r']], tabung: [['v-r','Jari-jari','r'],['v-t','Tinggi','t']], kerucut: [['v-r','Jari-jari','r'],['v-t','Tinggi','t']] };
        f.innerHTML = cfg[s].map(c => this._mkInput(c[0], c[1], c[2])).join('');
    },
    _calcVol() {
        const s = document.getElementById('vol-shape').value, n = this._n.bind(this); let r;
        if (s==='kubus') { const a=n('v-a'); r=a**3; }
        else if (s==='balok') { r=n('v-p')*n('v-l')*n('v-t'); }
        else if (s==='bola') { const x=n('v-r'); r=(4/3)*Math.PI*x**3; }
        else if (s==='tabung') { r=Math.PI*n('v-r')**2*n('v-t'); }
        else if (s==='kerucut') { r=(1/3)*Math.PI*n('v-r')**2*n('v-t'); }
        if (isNaN(r)) return; this._showRes(document.getElementById('vol-res'), this._fmt(r, 'satuan³'));
    },

    // ── Luas Permukaan ──
    _adv_luasRuang(body) {
        body.innerHTML = `<h3>Luas Permukaan</h3>
            ${this._mkSelect('lr-shape','Bentuk',[['kubus','Kubus'],['balok','Balok'],['bola','Bola'],['tabung','Tabung'],['kerucut','Kerucut']])}
            <div id="lr-fields"></div>
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._calcLR()">Hitung</button>
            <div class="adv-result" id="lr-res"></div>`;
        document.getElementById('lr-shape').onchange = () => this._lrFields();
        this._lrFields();
    },
    _lrFields() {
        const s = document.getElementById('lr-shape').value, f = document.getElementById('lr-fields');
        const cfg = { kubus: [['lr-a','Sisi','s']], balok: [['lr-p','Panjang','p'],['lr-l','Lebar','l'],['lr-t','Tinggi','t']], bola: [['lr-r','Jari-jari','r']], tabung: [['lr-r','Jari-jari','r'],['lr-t','Tinggi','t']], kerucut: [['lr-r','Jari-jari','r'],['lr-t','Tinggi','t']] };
        f.innerHTML = cfg[s].map(c => this._mkInput(c[0], c[1], c[2])).join('');
    },
    _calcLR() {
        const s = document.getElementById('lr-shape').value, n = this._n.bind(this); let r;
        if (s==='kubus') r=6*n('lr-a')**2;
        else if (s==='balok') { const p=n('lr-p'),l=n('lr-l'),t=n('lr-t'); r=2*(p*l+p*t+l*t); }
        else if (s==='bola') r=4*Math.PI*n('lr-r')**2;
        else if (s==='tabung') { const x=n('lr-r'),t=n('lr-t'); r=2*Math.PI*x*(x+t); }
        else if (s==='kerucut') { const x=n('lr-r'),t=n('lr-t'); r=Math.PI*x*(x+Math.sqrt(x**2+t**2)); }
        if (isNaN(r)) return; this._showRes(document.getElementById('lr-res'), this._fmt(r, 'satuan²'));
    },

    // ── Keliling ──
    _adv_keliling(body) {
        body.innerHTML = `<h3>Keliling Bangun Datar</h3>
            ${this._mkSelect('kel-shape','Bentuk',[['persegi','Persegi'],['persegi-panjang','Persegi Panjang'],['segitiga','Segitiga'],['lingkaran','Lingkaran']])}
            <div id="kel-fields"></div>
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._calcKel()">Hitung</button>
            <div class="adv-result" id="kel-res"></div>`;
        document.getElementById('kel-shape').onchange = () => this._kelFields();
        this._kelFields();
    },
    _kelFields() {
        const s = document.getElementById('kel-shape').value, f = document.getElementById('kel-fields');
        const cfg = { persegi: [['kel-a','Sisi','s']], 'persegi-panjang': [['kel-p','Panjang','p'],['kel-l','Lebar','l']], segitiga: [['kel-a','Sisi a','a'],['kel-b','Sisi b','b'],['kel-c','Sisi c','c']], lingkaran: [['kel-r','Jari-jari','r']] };
        f.innerHTML = cfg[s].map(c => this._mkInput(c[0], c[1], c[2])).join('');
    },
    _calcKel() {
        const s = document.getElementById('kel-shape').value, n = this._n.bind(this); let r;
        if (s==='persegi') r=4*n('kel-a');
        else if (s==='persegi-panjang') r=2*(n('kel-p')+n('kel-l'));
        else if (s==='segitiga') r=n('kel-a')+n('kel-b')+n('kel-c');
        else if (s==='lingkaran') r=2*Math.PI*n('kel-r');
        if (isNaN(r)) return; this._showRes(document.getElementById('kel-res'), this._fmt(r, 'satuan'));
    },

    // ── Luas Datar ──
    _adv_luasDatar(body) {
        body.innerHTML = `<h3>Luas Bangun Datar</h3>
            ${this._mkSelect('ld-shape','Bentuk',[['persegi','Persegi'],['persegi-panjang','Persegi Panjang'],['segitiga','Segitiga'],['lingkaran','Lingkaran'],['trapesium','Trapesium']])}
            <div id="ld-fields"></div>
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._calcLD()">Hitung</button>
            <div class="adv-result" id="ld-res"></div>`;
        document.getElementById('ld-shape').onchange = () => this._ldFields();
        this._ldFields();
    },
    _ldFields() {
        const s = document.getElementById('ld-shape').value, f = document.getElementById('ld-fields');
        const cfg = { persegi:[['ld-a','Sisi','s']], 'persegi-panjang':[['ld-p','Panjang','p'],['ld-l','Lebar','l']], segitiga:[['ld-a','Alas','a'],['ld-t','Tinggi','t']], lingkaran:[['ld-r','Jari-jari','r']], trapesium:[['ld-a','Sisi a','a'],['ld-b','Sisi b','b'],['ld-t','Tinggi','t']] };
        f.innerHTML = cfg[s].map(c => this._mkInput(c[0], c[1], c[2])).join('');
    },
    _calcLD() {
        const s = document.getElementById('ld-shape').value, n = this._n.bind(this); let r;
        if (s==='persegi') r=n('ld-a')**2;
        else if (s==='persegi-panjang') r=n('ld-p')*n('ld-l');
        else if (s==='segitiga') r=0.5*n('ld-a')*n('ld-t');
        else if (s==='lingkaran') r=Math.PI*n('ld-r')**2;
        else if (s==='trapesium') r=0.5*(n('ld-a')+n('ld-b'))*n('ld-t');
        if (isNaN(r)) return; this._showRes(document.getElementById('ld-res'), this._fmt(r, 'satuan²'));
    },

    // ── Unit Converters (generic) ──
    _advConvert(body, title, id, units, factors) {
        body.innerHTML = `<h3>${title}</h3>
            ${this._mkInput(id+'-val','Nilai','Masukkan nilai')}
            ${this._mkSelect(id+'-from','Dari',units)}
            ${this._mkSelect(id+'-to','Ke',units)}
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._doConvert('${id}')">Konversi</button>
            <div class="adv-result" id="${id}-res"></div>`;
        document.getElementById(id+'-val')._factors = factors;
    },
    _doConvert(id) {
        const v = this._n(id+'-val'), f = document.getElementById(id+'-from').value, t = document.getElementById(id+'-to').value;
        const factors = document.getElementById(id+'-val')._factors;
        if (isNaN(v)) return;
        const r = v * factors[f] / factors[t];
        this._showRes(document.getElementById(id+'-res'), this._fmt(r, t));
    },

    _adv_berat(body) {
        this._advConvert(body,'Konversi Berat','berat',[['mg','Miligram'],['g','Gram'],['kg','Kilogram'],['ton','Ton'],['lb','Pound'],['oz','Ounce']],{mg:1e-6,g:1e-3,kg:1,ton:1000,lb:0.453592,oz:0.0283495});
    },
    _adv_jarak(body) {
        this._advConvert(body,'Konversi Jarak','jarak',[['mm','Milimeter'],['cm','Centimeter'],['m','Meter'],['km','Kilometer'],['mi','Mile'],['yd','Yard'],['ft','Feet'],['in','Inch']],{mm:0.001,cm:0.01,m:1,km:1000,mi:1609.34,yd:0.9144,ft:0.3048,in:0.0254});
    },
    _adv_waktu(body) {
        this._advConvert(body,'Konversi Waktu','waktu',[['detik','Detik'],['menit','Menit'],['jam','Jam'],['hari','Hari'],['minggu','Minggu'],['tahun','Tahun']],{detik:1,menit:60,jam:3600,hari:86400,minggu:604800,tahun:31557600});
    },
    _adv_kecepatan(body) {
        this._advConvert(body,'Konversi Kecepatan','speed',[['ms','m/s'],['kmh','km/h'],['mph','mph'],['knot','Knot']],{ms:1,kmh:1/3.6,mph:0.44704,knot:0.514444});
    },

    // ── Suhu ──
    _adv_suhu(body) {
        body.innerHTML = `<h3>Konversi Suhu</h3>
            ${this._mkInput('suhu-val','Nilai','Suhu')}
            ${this._mkSelect('suhu-from','Dari',[['C','Celsius'],['F','Fahrenheit'],['K','Kelvin']])}
            ${this._mkSelect('suhu-to','Ke',[['C','Celsius'],['F','Fahrenheit'],['K','Kelvin']])}
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._calcSuhu()">Konversi</button>
            <div class="adv-result" id="suhu-res"></div>`;
    },
    _calcSuhu() {
        const v=this._n('suhu-val'), f=document.getElementById('suhu-from').value, t=document.getElementById('suhu-to').value;
        if (isNaN(v)) return;
        let c = f==='C'?v : f==='F'?(v-32)*5/9 : v-273.15;
        let r = t==='C'?c : t==='F'?c*9/5+32 : c+273.15;
        const sym={C:'°C',F:'°F',K:'K'};
        this._showRes(document.getElementById('suhu-res'), this._fmt(r, sym[t]));
    },

    // ── Uang (static) ──
    _adv_uang(body) {
        this._advConvert(body,'Konversi Mata Uang (Statis)','uang',[['IDR','IDR'],['USD','USD'],['EUR','EUR'],['SGD','SGD'],['MYR','MYR'],['JPY','JPY'],['GBP','GBP'],['AUD','AUD']],{IDR:1,USD:15800,EUR:17200,SGD:11700,MYR:3350,JPY:105,GBP:20100,AUD:10300});
    },

    // ── Pythagoras ──
    _adv_pythagoras(body) {
        body.innerHTML = `<h3>Kalkulator Pythagoras</h3>
            ${this._mkInput('pyth-a','Sisi a','a')}${this._mkInput('pyth-b','Sisi b','b')}
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._calcPyth()">Hitung</button>
            <div class="adv-result" id="pyth-res"></div>`;
    },
    _calcPyth() {
        const a=this._n('pyth-a'),b=this._n('pyth-b');
        if (isNaN(a)||isNaN(b)) return;
        this._showRes(document.getElementById('pyth-res'), 'c = '+this._fmt(Math.sqrt(a**2+b**2),'satuan'));
    },

    // ── Persen ──
    _adv_persen(body) {
        body.innerHTML = `<h3>Kalkulator Persentase</h3>
            ${this._mkInput('prs-val','Nilai','Nilai')}${this._mkInput('prs-pct','Persentase','%')}
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._calcPrs()">Hitung</button>
            <div class="adv-result" id="prs-res"></div>`;
    },
    _calcPrs() {
        const v=this._n('prs-val'),p=this._n('prs-pct');
        if (isNaN(v)||isNaN(p)) return;
        this._showRes(document.getElementById('prs-res'), this._fmt(v*p/100)+` (${p}% dari ${this._fmt(v)})`);
    },

    // ── Pecahan ──
    _adv_pecahan(body) {
        body.innerHTML = `<h3>Pecahan ke Desimal</h3>
            ${this._mkInput('pec-a','Pembilang','a')}${this._mkInput('pec-b','Penyebut','b')}
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._calcPec()">Hitung</button>
            <div class="adv-result" id="pec-res"></div>`;
    },
    _calcPec() {
        const a=this._n('pec-a'),b=this._n('pec-b');
        if (isNaN(a)||isNaN(b)||b===0) return;
        this._showRes(document.getElementById('pec-res'), `${a}/${b} = ${parseFloat((a/b).toFixed(8))}`);
    },

    // ── Skala ──
    _adv_skala(body) {
        body.innerHTML = `<h3>Skala & Perbandingan</h3>
            ${this._mkInput('skl-peta','Jarak di Peta (cm)','cm')}${this._mkInput('skl-val','Skala (1:...)','skala')}
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._calcSkl()">Hitung</button>
            <div class="adv-result" id="skl-res"></div>`;
    },
    _calcSkl() {
        const p=this._n('skl-peta'),s=this._n('skl-val');
        if (isNaN(p)||isNaN(s)) return;
        const cm=p*s; let r;
        if (cm>=1e5) r=this._fmt(cm/1e5,'km'); else if (cm>=100) r=this._fmt(cm/100,'m'); else r=this._fmt(cm,'cm');
        this._showRes(document.getElementById('skl-res'), r);
    },

    // ── Diskon ──
    _adv_diskon(body) {
        body.innerHTML = `<h3>Kalkulator Diskon</h3>
            ${this._mkInput('dsk-h','Harga','Rp')}${this._mkInput('dsk-p','Diskon (%)','%')}
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._calcDsk()">Hitung</button>
            <div class="adv-result" id="dsk-res"></div>`;
    },
    _calcDsk() {
        const h=this._n('dsk-h'),p=this._n('dsk-p');
        if (isNaN(h)||isNaN(p)) return;
        const hemat=h*p/100;
        this._showRes(document.getElementById('dsk-res'), `Rp ${this._fmt(h-hemat)} (hemat Rp ${this._fmt(hemat)})`);
    },

    // ── Cicilan ──
    _adv_cicilan(body) {
        body.innerHTML = `<h3>Kalkulator Cicilan</h3>
            ${this._mkInput('cic-p','Pokok Pinjaman','Rp')}${this._mkInput('cic-b','Bunga/bulan (%)','%')}${this._mkInput('cic-n','Tenor (bulan)','bulan')}
            <button class="xp-btn xp-btn-primary" onclick="Apps.Calculator._calcCic()">Hitung</button>
            <div class="adv-result" id="cic-res"></div>`;
    },
    _calcCic() {
        const P=this._n('cic-p'),r=this._n('cic-b')/100,n=this._n('cic-n');
        if (isNaN(P)||isNaN(r)||isNaN(n)||n<1) return;
        const ang = r===0 ? P/n : P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
        const total=ang*n;
        this._showRes(document.getElementById('cic-res'), `Angsuran: Rp ${this._fmt(ang)} | Total: Rp ${this._fmt(total)} | Bunga: Rp ${this._fmt(total-P)}`);
    },
};
