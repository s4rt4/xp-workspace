/**
 * Dummy Generator App — Generate fake data for testing
 * Based on DummyGator project, themed for XP Workspace
 * Uses Faker.js v3.1.0 (global `faker`)
 */
Apps.DummyGenerator = {
    _fakerLoaded: false,
    _currentData: [],   // current generated data array for export

    generators: {
        person:   { title: 'Person Data',          icon: 'search-for-people.png' },
        username: { title: 'Username & Account',   icon: 'login-question.png' },
        text:     { title: 'Text / Lorem Ipsum',   icon: 'generic-text-document.png' },
        location: { title: 'Address / Location',   icon: 'my-network-places.png' },
        company:  { title: 'Company Data',          icon: 'briefcase.png' },
        ecommerce:{ title: 'E-Commerce Product',   icon: 'packager.png' },
        finance:  { title: 'Credit Card',           icon: 'certificate.png' },
        security: { title: 'Security (UUID/Hash)', icon: 'security-settings.png' },
        image:    { title: 'Placeholder Image',     icon: 'bitmap.png' },
        avatar:   { title: 'Avatar Generator',      icon: 'user-accounts.png' },
        qrcode:   { title: 'QR Code',               icon: 'bitmap.png' },
    },

    open() {
        this._loadFaker().then(() => this._createWindow());
    },

    _js(u) {
        return new Promise(r => {
            if (document.querySelector(`script[src="${u}"]`)) return r();
            const s = document.createElement('script');
            s.src = u; s.onload = r; document.head.appendChild(s);
        });
    },

    _loadFaker() {
        if (this._fakerLoaded) return Promise.resolve();
        return this._js('https://cdnjs.cloudflare.com/ajax/libs/Faker/3.1.0/faker.min.js')
            .then(() => { this._fakerLoaded = true; });
    },

    _createWindow() {
        const menuItems = Object.entries(this.generators).map(([k, v]) =>
            `<div class="dg-menu-item" data-gen="${k}" onclick="Apps.DummyGenerator.show('${k}')">
                <img src="${ICON_PATH}/${v.icon}" style="width:16px;height:16px" alt="" onerror="this.style.display='none'">
                <span>${v.title}</span>
            </div>`
        ).join('');

        XP.createWindow('dummygenerator', {
            title: 'Dummy Generator',
            icon: 'dummygator.svg',
            width: 780, height: 520,
            content: `
                <style>
                    .dg-layout { display:flex; height:100%; margin:-8px; }
                    .dg-sidebar { width:175px; background:#f5f3e8; border-right:1px solid #d4d0c8; overflow-y:auto; padding:4px 0; flex-shrink:0; }
                    .dg-menu-item { display:flex; align-items:center; gap:6px; padding:5px 10px; cursor:pointer; font-size:11px; border:1px solid transparent; }
                    .dg-menu-item:hover { background:#e8f0fe; }
                    .dg-menu-item.active { background:var(--xp-selection); color:#fff; }
                    .dg-body { flex:1; padding:12px; overflow-y:auto; }
                    .dg-body h3 { font-size:13px; margin:0 0 10px; color:#003c74; }
                    .dg-row { margin-bottom:6px; }
                    .dg-row label { display:block; font-size:10px; color:#666; margin-bottom:1px; }
                    .dg-row-inline { display:inline-flex; align-items:center; gap:4px; margin-bottom:4px; }
                    .dg-actions { display:flex; gap:4px; margin-top:8px; flex-wrap:wrap; }
                    .dg-result { margin-top:8px; max-height:300px; overflow-y:auto; }
                    .dg-card { background:#fff; border:1px solid #d4d0c8; padding:8px 10px; margin-bottom:6px; font-size:11px; }
                    .dg-card .dg-field { padding:2px 0; }
                    .dg-card .dg-field strong { color:#003c74; min-width:120px; display:inline-block; }
                    .dg-card-header { background:#ece9d8; padding:4px 8px; font-weight:bold; font-size:11px; color:#003c74; border:1px solid #d4d0c8; border-bottom:none; }
                    .dg-checkboxes { display:flex; flex-wrap:wrap; gap:4px 12px; margin-bottom:8px; padding:6px 8px; background:#f5f3e8; border:1px solid #d4d0c8; }
                    .dg-checkboxes label { font-size:11px; cursor:pointer; display:flex; align-items:center; gap:4px; white-space:nowrap; }
                    .dg-checkboxes input[type="checkbox"] { width:14px; height:14px; accent-color:#316ac5; appearance:auto !important; -webkit-appearance:checkbox !important; position:static !important; opacity:1 !important; }
                    .dg-text-result { background:#f5f3e8; border:1px solid #d4d0c8; padding:8px; font-family:Consolas,monospace; font-size:11px; margin-top:8px; white-space:pre-wrap; word-break:break-all; max-height:250px; overflow-y:auto; }
                    .dg-cc-card { background:linear-gradient(135deg,#1a1a2e,#16213e); color:#e0e0e0; border-radius:8px; padding:14px 18px; margin-bottom:8px; font-family:Consolas,monospace; min-width:280px; }
                    .dg-cc-card .cc-number { font-size:15px; letter-spacing:2px; margin:10px 0; color:#fff; }
                    .dg-cc-card .cc-row { display:flex; justify-content:space-between; font-size:10px; }
                    .dg-cc-card .cc-type { font-size:12px; font-weight:bold; text-transform:uppercase; color:#7ec8e3; }
                </style>
                <div class="dg-layout">
                    <div class="dg-sidebar">${menuItems}</div>
                    <div class="dg-body" id="dg-body"><div style="text-align:center;padding:40px;color:#999">Select a generator</div></div>
                </div>
            `,
            onReady: () => this.show('person'),
        });
    },

    show(id) {
        document.querySelectorAll('.dg-menu-item').forEach(m => m.classList.remove('active'));
        document.querySelector(`.dg-menu-item[data-gen="${id}"]`)?.classList.add('active');
        const body = document.getElementById('dg-body');
        if (!body) return;
        this._currentData = [];
        const fn = this['_gen_' + id];
        if (fn) fn.call(this, body);
    },

    // ── Helpers ──

    _copyAll() {
        if (!this._currentData.length) return;
        const text = this._currentData.map(item => {
            return Object.entries(item).map(([k, v]) => `${k}: ${v}`).join('\n');
        }).join('\n---\n');
        navigator.clipboard.writeText(text);
        XP.notify('Copied', 'All data copied to clipboard');
    },

    _exportJSON(filename) {
        if (!this._currentData.length) return;
        const json = JSON.stringify(this._currentData.length === 1 ? this._currentData[0] : this._currentData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${filename}_${Date.now()}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    _exportCSV(filename) {
        if (!this._currentData.length) return;
        const headers = Object.keys(this._currentData[0]);
        let csv = headers.join(',') + '\n';
        this._currentData.forEach(row => {
            csv += headers.map(h => {
                let cell = (row[h] == null ? '' : String(row[h])).replace(/"/g, '""');
                if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
                return cell;
            }).join(',') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${filename}_${Date.now()}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    _exportBtns(name) {
        return `<button class="xp-btn" onclick="Apps.DummyGenerator._copyAll()" title="Copy All">Copy All</button>
                <button class="xp-btn" onclick="Apps.DummyGenerator._exportJSON('${name}')" title="Export JSON">JSON</button>
                <button class="xp-btn" onclick="Apps.DummyGenerator._exportCSV('${name}')" title="Export CSV">CSV</button>`;
    },

    _renderCards(dataArr, container) {
        this._currentData = dataArr;
        const el = document.getElementById(container);
        if (!el) return;
        if (!dataArr.length) { el.innerHTML = '<div style="color:#999;font-size:11px">No data generated.</div>'; return; }
        el.innerHTML = dataArr.map((item, idx) => {
            const fields = Object.entries(item).map(([k, v]) =>
                `<div class="dg-field"><strong>${esc(k)}:</strong> ${esc(String(v))}</div>`
            ).join('');
            return dataArr.length > 1
                ? `<div class="dg-card-header">#${idx + 1}</div><div class="dg-card">${fields}</div>`
                : `<div class="dg-card">${fields}</div>`;
        }).join('');
    },

    // ── Person Generator ──
    _gen_person(body) {
        const fields = [
            { val: 'fullName',    label: 'Nama Lengkap',       checked: true },
            { val: 'gender',      label: 'Jenis Kelamin',      checked: false },
            { val: 'dob',         label: 'Tanggal Lahir/Umur', checked: false },
            { val: 'nationality', label: 'Kewarganegaraan',    checked: false },
            { val: 'religion',    label: 'Agama',              checked: false },
            { val: 'jobTitle',    label: 'Pekerjaan/Jabatan',  checked: true },
            { val: 'companyName', label: 'Nama Kantor',        checked: true },
            { val: 'workAddress', label: 'Alamat Kantor',      checked: false },
            { val: 'homeAddress', label: 'Alamat Rumah',       checked: true },
            { val: 'email',       label: 'Alamat Email',       checked: true },
            { val: 'phone',       label: 'Nomor Telepon',      checked: true },
            { val: 'height',      label: 'Tinggi Badan (cm)',  checked: false },
            { val: 'weight',      label: 'Berat Badan (kg)',   checked: false },
        ];
        const checks = fields.map(f =>
            `<label><input type="checkbox" class="dg-person-chk" value="${f.val}" ${f.checked ? 'checked' : ''}> ${f.label}</label>`
        ).join('');
        body.innerHTML = `<h3>Person Data Generator</h3>
            <div class="dg-checkboxes">${checks}</div>
            <div class="dg-row"><label>Count</label><input class="xp-input" type="number" id="dg-person-count" value="1" min="1" max="20" style="width:60px"></div>
            <div class="dg-actions">
                <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doPerson()">Generate</button>
                ${this._exportBtns('person_data')}
            </div>
            <div class="dg-result" id="dg-result"></div>`;
    },
    _doPerson() {
        const selected = Array.from(document.querySelectorAll('.dg-person-chk:checked')).map(c => c.value);
        if (!selected.length) { document.getElementById('dg-result').innerHTML = '<div style="color:orange;font-size:11px">Select at least one field.</div>'; return; }
        const count = parseInt(document.getElementById('dg-person-count').value) || 1;
        const religions = ['Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Buddha', 'Khonghucu'];
        const nationalities = ['WNI', 'WNA'];

        try { faker.locale = 'id_ID'; } catch(e) { faker.locale = 'en'; }

        const data = Array.from({ length: count }, () => {
            const item = {};
            selected.forEach(field => {
                switch (field) {
                    case 'fullName':    item['Nama Lengkap'] = faker.name.findName(); break;
                    case 'gender':      item['Jenis Kelamin'] = faker.random.number(1) === 0 ? 'Laki-laki' : 'Perempuan'; break;
                    case 'dob': {
                        const dob = faker.date.past(50, new Date('2005-01-01'));
                        const age = new Date().getFullYear() - dob.getFullYear();
                        item['Tanggal Lahir / Umur'] = `${dob.toLocaleDateString('id-ID')} (Umur ~${age} tahun)`;
                        break;
                    }
                    case 'nationality': item['Kewarganegaraan'] = faker.random.arrayElement(nationalities); break;
                    case 'religion':    item['Agama'] = faker.random.arrayElement(religions); break;
                    case 'jobTitle':    item['Pekerjaan/Jabatan'] = faker.name.jobTitle(); break;
                    case 'companyName': item['Nama Kantor'] = faker.company.companyName(); break;
                    case 'workAddress': {
                        faker.locale = 'en_US';
                        item['Alamat Kantor'] = `${faker.address.streetAddress()}, ${faker.address.city()}, ${faker.address.stateAbbr()} ${faker.address.zipCode()}`;
                        try { faker.locale = 'id_ID'; } catch(e) { faker.locale = 'en'; }
                        break;
                    }
                    case 'homeAddress':
                        item['Alamat Rumah'] = `${faker.address.streetAddress()}, ${faker.address.city()}, ${faker.address.zipCode ? faker.address.zipCode() : ''}`;
                        break;
                    case 'email':  item['Alamat Email'] = faker.internet.email(); break;
                    case 'phone':  item['Nomor Telepon'] = faker.phone.phoneNumber(); break;
                    case 'height': item['Tinggi Badan (cm)'] = faker.random.number({ min: 150, max: 195 }); break;
                    case 'weight': item['Berat Badan (kg)'] = faker.random.number({ min: 45, max: 110 }); break;
                }
            });
            return item;
        });
        this._renderCards(data, 'dg-result');
    },

    // ── Username & Account Generator ──
    _gen_username(body) {
        body.innerHTML = `<h3>User Account Generator</h3>
            <div class="dg-row"><label>Count</label><input class="xp-input" type="number" id="dg-user-count" value="1" min="1" max="20" style="width:60px"></div>
            <div class="dg-actions">
                <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doUsername()">Generate</button>
                ${this._exportBtns('username_data')}
            </div>
            <div class="dg-result" id="dg-result"></div>`;
    },
    _doUsername() {
        faker.locale = 'en';
        const count = parseInt(document.getElementById('dg-user-count').value) || 1;
        const data = Array.from({ length: count }, () => {
            const firstName = faker.name.firstName();
            const lastName = faker.name.lastName();
            return {
                'Full Name': `${firstName} ${lastName}`,
                'Username': faker.internet.userName(firstName, lastName),
                'Email': faker.internet.email(firstName, lastName),
                'Password': faker.internet.password(10, true),
                'Password Hint': faker.lorem.word(),
            };
        });
        this._renderCards(data, 'dg-result');
    },

    // ── Text / Lorem Ipsum Generator ──
    _gen_text(body) {
        body.innerHTML = `<h3>Text / Lorem Ipsum Generator</h3>
            <div class="dg-row"><label>Type</label>
                <select class="xp-select" id="dg-text-type">
                    <option value="paragraphs">Paragraphs</option>
                    <option value="sentences">Sentences</option>
                    <option value="words">Words</option>
                    <option value="lines">Lines</option>
                    <option value="characters">Characters</option>
                </select>
            </div>
            <div class="dg-row"><label>Count</label><input class="xp-input" type="number" id="dg-text-count" value="3" min="1" max="100" style="width:60px"></div>
            <div class="dg-actions">
                <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doText()">Generate</button>
                <button class="xp-btn" onclick="Apps.DummyGenerator._copyText()">Copy</button>
                <button class="xp-btn" onclick="document.getElementById('dg-text-area').value=''">Clear</button>
            </div>
            <textarea class="dg-text-result" id="dg-text-area" rows="10" style="width:100%;resize:vertical;margin-top:8px" readonly></textarea>`;
    },
    _doText() {
        const type = document.getElementById('dg-text-type').value;
        const count = parseInt(document.getElementById('dg-text-count').value) || 3;
        let result = '';
        switch (type) {
            case 'paragraphs': result = faker.lorem.paragraphs(count, '\n\n'); break;
            case 'sentences':  result = faker.lorem.sentences(count, ' '); break;
            case 'words':      result = faker.lorem.words(count); break;
            case 'lines':      result = faker.lorem.lines(count); break;
            case 'characters': {
                const base = faker.lorem.paragraphs(Math.ceil(count / 150) || 1);
                result = base.replace(/[\r\n]+/g, ' ').substring(0, count);
                break;
            }
        }
        document.getElementById('dg-text-area').value = result;
        this._currentData = [{ type, count, text: result }];
    },
    _copyText() {
        const el = document.getElementById('dg-text-area');
        if (el && el.value) { navigator.clipboard.writeText(el.value); XP.notify('Copied', 'Text copied to clipboard'); }
    },

    // ── Location Generator ──
    _gen_location(body) {
        body.innerHTML = `<h3>Location / Address Generator</h3>
            <div class="dg-row"><label>Count</label><input class="xp-input" type="number" id="dg-loc-count" value="1" min="1" max="20" style="width:60px"></div>
            <div class="dg-actions">
                <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doLocation()">Generate</button>
                ${this._exportBtns('location_data')}
            </div>
            <div class="dg-result" id="dg-result"></div>`;
    },
    _doLocation() {
        faker.locale = 'en_US';
        const count = parseInt(document.getElementById('dg-loc-count').value) || 1;
        const data = Array.from({ length: count }, () => ({
            'Street Address': faker.address.streetAddress(),
            'City': faker.address.city(),
            'State': faker.address.state(),
            'Zip Code': faker.address.zipCode(),
            'Country': faker.address.country(),
            'Latitude': faker.address.latitude(),
            'Longitude': faker.address.longitude(),
        }));
        this._renderCards(data, 'dg-result');
    },

    // ── Company Generator ──
    _gen_company(body) {
        const fields = [
            { val: 'companyName', label: 'Nama Perusahaan',  checked: true },
            { val: 'industry',    label: 'Bidang Industri',   checked: false },
            { val: 'catchPhrase', label: 'Deskripsi Singkat', checked: true },
            { val: 'directorName',label: 'Nama Direktur',     checked: false },
            { val: 'foundingYear',label: 'Tahun Berdiri',     checked: false },
            { val: 'employeeCount',label:'Jumlah Karyawan',   checked: false },
            { val: 'regNumber',   label: 'Nomor Registrasi',  checked: false },
            { val: 'phone',       label: 'Nomor Telepon',     checked: true },
            { val: 'email',       label: 'Email Perusahaan',  checked: true },
            { val: 'website',     label: 'Website',           checked: true },
            { val: 'address',     label: 'Alamat Kantor',     checked: true },
        ];
        const checks = fields.map(f =>
            `<label><input type="checkbox" class="dg-company-chk" value="${f.val}" ${f.checked ? 'checked' : ''}> ${f.label}</label>`
        ).join('');
        body.innerHTML = `<h3>Company Data Generator</h3>
            <div class="dg-checkboxes">${checks}</div>
            <div class="dg-row"><label>Count</label><input class="xp-input" type="number" id="dg-comp-count" value="1" min="1" max="20" style="width:60px"></div>
            <div class="dg-actions">
                <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doCompany()">Generate</button>
                ${this._exportBtns('company_data')}
            </div>
            <div class="dg-result" id="dg-result"></div>`;
    },
    _doCompany() {
        const selected = Array.from(document.querySelectorAll('.dg-company-chk:checked')).map(c => c.value);
        if (!selected.length) { document.getElementById('dg-result').innerHTML = '<div style="color:orange;font-size:11px">Select at least one field.</div>'; return; }
        const count = parseInt(document.getElementById('dg-comp-count').value) || 1;
        const industries = ['Teknologi Informasi', 'Keuangan', 'Manufaktur', 'Pendidikan', 'Kesehatan', 'Retail', 'Konstruksi', 'Transportasi', 'Pariwisata', 'Konsultasi'];
        const regFormats = ['PT-######', 'CV-#####', 'UD-####', 'SIUP-#######'];
        faker.locale = 'en';

        const data = Array.from({ length: count }, () => {
            const item = {};
            const domain = faker.internet.domainName();
            selected.forEach(field => {
                switch (field) {
                    case 'companyName':   item['Nama Perusahaan'] = faker.company.companyName(); break;
                    case 'industry':      item['Bidang Industri'] = faker.random.arrayElement(industries); break;
                    case 'catchPhrase':   item['Deskripsi Singkat'] = faker.company.catchPhrase(); break;
                    case 'directorName':  item['Nama Direktur'] = faker.name.findName(); break;
                    case 'foundingYear': {
                        const past = faker.date.past(50, new Date(new Date().setFullYear(new Date().getFullYear() - 2)));
                        item['Tahun Berdiri'] = past.getFullYear();
                        break;
                    }
                    case 'employeeCount': item['Jumlah Karyawan'] = faker.random.number({ min: 5, max: 5000 }); break;
                    case 'regNumber': {
                        const fmt = faker.random.arrayElement(regFormats);
                        item['Nomor Registrasi'] = faker.helpers.replaceSymbolWithNumber(fmt, '#');
                        break;
                    }
                    case 'phone':   item['Nomor Telepon'] = faker.phone.phoneNumber(); break;
                    case 'email':   item['Email Perusahaan'] = `info@${domain}`; break;
                    case 'website': item['Website'] = `https://${domain}`; break;
                    case 'address': {
                        faker.locale = 'en_US';
                        item['Alamat Kantor'] = `${faker.address.streetAddress()}, ${faker.address.city()}, ${faker.address.stateAbbr()} ${faker.address.zipCode()}`;
                        faker.locale = 'en';
                        break;
                    }
                }
            });
            return item;
        });
        this._renderCards(data, 'dg-result');
    },

    // ── E-Commerce Generator ──
    _gen_ecommerce(body) {
        body.innerHTML = `<h3>E-Commerce Product Generator</h3>
            <div style="display:flex;flex-wrap:wrap;gap:6px 16px;margin-bottom:8px;font-size:11px">
                <label><input type="checkbox" class="dg-ecom-chk" value="productName" checked> Product Name</label>
                <label><input type="checkbox" class="dg-ecom-chk" value="description" checked> Description</label>
                <label><input type="checkbox" class="dg-ecom-chk" value="price" checked> Price</label>
                <label><input type="checkbox" class="dg-ecom-chk" value="size"> Size (PxL cm)</label>
                <label><input type="checkbox" class="dg-ecom-chk" value="color"> Color</label>
                <label><input type="checkbox" class="dg-ecom-chk" value="category"> Category</label>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">
                <div class="dg-row"><label>Currency</label>
                    <select class="xp-select" id="dg-ecom-currency">
                        <option value="IDR">IDR (Rp)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (&euro;)</option>
                        <option value="GBP">GBP (&pound;)</option>
                    </select>
                </div>
                <div class="dg-row"><label>Count</label><input class="xp-input" type="number" id="dg-ecom-count" value="1" min="1" max="20" style="width:60px"></div>
            </div>
            <div class="dg-actions">
                <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doEcommerce()">Generate</button>
                ${this._exportBtns('ecommerce_data')}
            </div>
            <div class="dg-result" id="dg-result"></div>`;
    },
    _doEcommerce() {
        const selected = Array.from(document.querySelectorAll('.dg-ecom-chk:checked')).map(c => c.value);
        if (!selected.length) { document.getElementById('dg-result').innerHTML = '<div style="color:orange;font-size:11px">Select at least one field.</div>'; return; }
        const count = parseInt(document.getElementById('dg-ecom-count').value) || 1;
        const currency = document.getElementById('dg-ecom-currency').value;
        const symbols = { IDR: 'Rp', USD: '$', EUR: '\u20AC', GBP: '\u00A3' };
        const categories = ['Elektronik', 'Fashion Pria', 'Fashion Wanita', 'Kebutuhan Rumah', 'Olahraga', 'Otomotif', 'Mainan & Hobi', 'Buku & Alat Tulis', 'Makanan & Minuman'];
        faker.locale = 'en';

        const data = Array.from({ length: count }, () => {
            const item = {};
            selected.forEach(field => {
                switch (field) {
                    case 'productName': item['Nama Produk'] = faker.commerce.productName(); break;
                    case 'description': item['Deskripsi'] = faker.lorem.sentences(2); break;
                    case 'price': {
                        const sym = symbols[currency] || currency;
                        const min = currency === 'IDR' ? 10000 : 1;
                        const max = currency === 'IDR' ? 5000000 : 1000;
                        const dec = currency === 'IDR' ? 0 : 2;
                        let price = faker.commerce.price(min, max, dec);
                        item['Harga'] = currency === 'IDR'
                            ? `${sym} ${parseInt(price).toLocaleString('id-ID')}`
                            : `${sym} ${price}`;
                        break;
                    }
                    case 'size': {
                        const l = faker.random.number({ min: 10, max: 200 });
                        const w = faker.random.number({ min: 10, max: 150 });
                        item['Ukuran (PxL cm)'] = `${l} x ${w} cm`;
                        break;
                    }
                    case 'color':    item['Warna'] = faker.commerce.color(); break;
                    case 'category': item['Kategori'] = faker.random.arrayElement(categories); break;
                }
            });
            return item;
        });
        this._renderCards(data, 'dg-result');
    },

    // ── Finance (Credit Card) Generator ──
    _gen_finance(body) {
        body.innerHTML = `<h3>Credit Card Generator</h3>
            <p style="font-size:10px;color:#888;margin:0 0 8px">Generate Luhn-valid dummy card numbers for testing.</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">
                <div class="dg-row"><label>Card Issuer</label>
                    <select class="xp-select" id="dg-cc-issuer">
                        <option value="random">Random</option>
                        <option value="visa">Visa</option>
                        <option value="mastercard">MasterCard</option>
                        <option value="amex">American Express</option>
                        <option value="discover">Discover</option>
                    </select>
                </div>
                <div class="dg-row"><label>Count</label><input class="xp-input" type="number" id="dg-cc-count" value="1" min="1" max="20" style="width:60px"></div>
            </div>
            <div class="dg-actions">
                <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doFinance()">Generate</button>
                ${this._exportBtns('creditcard_data')}
            </div>
            <div class="dg-result" id="dg-result"></div>`;
    },
    _generateCC(prefix, length) {
        let cc = prefix;
        while (cc.length < length - 1) cc += Math.floor(Math.random() * 10);
        let sum = 0;
        const rev = cc.split('').reverse().join('');
        for (let i = 0; i < rev.length; i++) {
            let d = parseInt(rev[i]);
            if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
            sum += d;
        }
        return cc + ((10 - (sum % 10)) % 10);
    },
    _formatCC(num) {
        if (num.length === 15) return num.replace(/(.{4})(.{6})(.{5})/, '$1 $2 $3');
        return num.replace(/(.{4})/g, '$1 ').trim();
    },
    _doFinance() {
        const issuerVal = document.getElementById('dg-cc-issuer').value;
        const count = parseInt(document.getElementById('dg-cc-count').value) || 1;
        const issuers = {
            visa:       { prefixes: ['4'], length: 16, name: 'Visa' },
            mastercard: { prefixes: ['51','52','53','54','55'], length: 16, name: 'MasterCard' },
            amex:       { prefixes: ['34','37'], length: 15, name: 'Amex' },
            discover:   { prefixes: ['6011'], length: 16, name: 'Discover' },
        };
        const issuerKeys = Object.keys(issuers);

        const data = [];
        const el = document.getElementById('dg-result');
        if (!el) return;
        let html = '';

        for (let i = 0; i < count; i++) {
            const key = issuerVal === 'random' ? issuerKeys[Math.floor(Math.random() * issuerKeys.length)] : issuerVal;
            const iss = issuers[key];
            const prefix = iss.prefixes[Math.floor(Math.random() * iss.prefixes.length)];
            const num = this._generateCC(prefix, iss.length);
            const formatted = this._formatCC(num);
            const expMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const expYear = Math.floor(Math.random() * 5) + 26;
            const cvvLen = key === 'amex' ? 4 : 3;
            const cvv = String(Math.floor(Math.random() * Math.pow(10, cvvLen))).padStart(cvvLen, '0');
            const holder = faker.name.findName().toUpperCase();

            data.push({
                'Type': iss.name,
                'Number': num,
                'Formatted': formatted,
                'Expiry': `${expMonth}/${expYear}`,
                'CVV': cvv,
                'Holder': holder,
            });

            html += `<div class="dg-cc-card">
                <div class="cc-type">${esc(iss.name)}</div>
                <div class="cc-number">${esc(formatted)}</div>
                <div class="cc-row">
                    <div><span style="font-size:8px;color:#aaa">EXPIRES</span><br>${esc(expMonth + '/' + expYear)}</div>
                    <div><span style="font-size:8px;color:#aaa">CVV</span><br>${esc(cvv)}</div>
                </div>
                <div style="margin-top:6px;font-size:10px;letter-spacing:1px">${esc(holder)}</div>
            </div>`;
        }
        this._currentData = data;
        el.innerHTML = html;
    },

    // ── Security (UUID & Hash) Generator ──
    _gen_security(body) {
        body.innerHTML = `<h3>Security Tools (UUID & Hash)</h3>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
                <div style="flex:1;min-width:220px">
                    <h4 style="font-size:12px;color:#003c74;margin:0 0 6px">UUID v4 Generator</h4>
                    <div class="dg-row"><label>Count</label><input class="xp-input" type="number" id="dg-uuid-count" value="5" min="1" max="100" style="width:60px"></div>
                    <div class="dg-actions">
                        <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doUUID()">Generate</button>
                        <button class="xp-btn" onclick="Apps.DummyGenerator._copyField('dg-uuid-result')">Copy</button>
                    </div>
                    <textarea class="dg-text-result" id="dg-uuid-result" rows="6" style="width:100%;resize:vertical;margin-top:6px" readonly></textarea>
                </div>
                <div style="flex:1;min-width:220px">
                    <h4 style="font-size:12px;color:#003c74;margin:0 0 6px">Hash Generator</h4>
                    <div class="dg-row"><label>Input Text</label><input class="xp-input" type="text" id="dg-hash-input" placeholder="Text to hash" style="width:100%"></div>
                    <div class="dg-row"><label>Algorithm</label>
                        <select class="xp-select" id="dg-hash-algo">
                            <option value="MD5">MD5</option>
                            <option value="SHA-1">SHA-1</option>
                            <option value="SHA-256">SHA-256</option>
                        </select>
                    </div>
                    <div class="dg-actions">
                        <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doHash()">Hash</button>
                        <button class="xp-btn" onclick="Apps.DummyGenerator._copyField('dg-hash-result')">Copy</button>
                    </div>
                    <textarea class="dg-text-result" id="dg-hash-result" rows="3" style="width:100%;resize:vertical;margin-top:6px" readonly></textarea>
                </div>
            </div>`;
    },
    _uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    },
    _doUUID() {
        const count = parseInt(document.getElementById('dg-uuid-count').value) || 5;
        const uuids = Array.from({ length: count }, () => this._uuidv4());
        document.getElementById('dg-uuid-result').value = uuids.join('\n');
        this._currentData = uuids.map(u => ({ UUID: u }));
    },
    async _doHash() {
        const text = document.getElementById('dg-hash-input').value;
        if (!text) { document.getElementById('dg-hash-result').value = 'Enter text to hash.'; return; }
        const algo = document.getElementById('dg-hash-algo').value;

        if (algo === 'MD5') {
            // Simple MD5 implementation (client-side)
            document.getElementById('dg-hash-result').value = this._md5(text);
            return;
        }

        // Use SubtleCrypto for SHA variants
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const hashBuffer = await crypto.subtle.digest(algo, data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            document.getElementById('dg-hash-result').value = hashHex;
        } catch (e) {
            document.getElementById('dg-hash-result').value = 'Error: ' + e.message;
        }
    },
    // Minimal MD5 implementation (client-side)
    _md5(string) {
        function md5cycle(x, k) {
            var a = x[0], b = x[1], c = x[2], d = x[3];
            a = ff(a,b,c,d,k[0],7,-680876936);d = ff(d,a,b,c,k[1],12,-389564586);c = ff(c,d,a,b,k[2],17,606105819);b = ff(b,c,d,a,k[3],22,-1044525330);
            a = ff(a,b,c,d,k[4],7,-176418897);d = ff(d,a,b,c,k[5],12,1200080426);c = ff(c,d,a,b,k[6],17,-1473231341);b = ff(b,c,d,a,k[7],22,-45705983);
            a = ff(a,b,c,d,k[8],7,1770035416);d = ff(d,a,b,c,k[9],12,-1958414417);c = ff(c,d,a,b,k[10],17,-42063);b = ff(b,c,d,a,k[11],22,-1990404162);
            a = ff(a,b,c,d,k[12],7,1804603682);d = ff(d,a,b,c,k[13],12,-40341101);c = ff(c,d,a,b,k[14],17,-1502002290);b = ff(b,c,d,a,k[15],22,1236535329);
            a = gg(a,b,c,d,k[1],5,-165796510);d = gg(d,a,b,c,k[6],9,-1069501632);c = gg(c,d,a,b,k[11],14,643717713);b = gg(b,c,d,a,k[0],20,-373897302);
            a = gg(a,b,c,d,k[5],5,-701558691);d = gg(d,a,b,c,k[10],9,38016083);c = gg(c,d,a,b,k[15],14,-660478335);b = gg(b,c,d,a,k[4],20,-405537848);
            a = gg(a,b,c,d,k[9],5,568446438);d = gg(d,a,b,c,k[14],9,-1019803690);c = gg(c,d,a,b,k[3],14,-187363961);b = gg(b,c,d,a,k[8],20,1163531501);
            a = gg(a,b,c,d,k[13],5,-1444681467);d = gg(d,a,b,c,k[2],9,-51403784);c = gg(c,d,a,b,k[7],14,1735328473);b = gg(b,c,d,a,k[12],20,-1926607734);
            a = hh(a,b,c,d,k[5],4,-378558);d = hh(d,a,b,c,k[8],11,-2022574463);c = hh(c,d,a,b,k[11],16,1839030562);b = hh(b,c,d,a,k[14],23,-35309556);
            a = hh(a,b,c,d,k[1],4,-1530992060);d = hh(d,a,b,c,k[4],11,1272893353);c = hh(c,d,a,b,k[7],16,-155497632);b = hh(b,c,d,a,k[10],23,-1094730640);
            a = hh(a,b,c,d,k[13],4,681279174);d = hh(d,a,b,c,k[0],11,-358537222);c = hh(c,d,a,b,k[3],16,-722521979);b = hh(b,c,d,a,k[6],23,76029189);
            a = hh(a,b,c,d,k[9],4,-640364487);d = hh(d,a,b,c,k[12],11,-421815835);c = hh(c,d,a,b,k[15],16,530742520);b = hh(b,c,d,a,k[2],23,-995338651);
            a = ii(a,b,c,d,k[0],6,-198630844);d = ii(d,a,b,c,k[7],10,1126891415);c = ii(c,d,a,b,k[14],15,-1416354905);b = ii(b,c,d,a,k[5],21,-57434055);
            a = ii(a,b,c,d,k[12],6,1700485571);d = ii(d,a,b,c,k[3],10,-1894986606);c = ii(c,d,a,b,k[10],15,-1051523);b = ii(b,c,d,a,k[1],21,-2054922799);
            a = ii(a,b,c,d,k[8],6,1873313359);d = ii(d,a,b,c,k[15],10,-30611744);c = ii(c,d,a,b,k[6],15,-1560198380);b = ii(b,c,d,a,k[13],21,1309151649);
            a = ii(a,b,c,d,k[4],6,-145523070);d = ii(d,a,b,c,k[11],10,-1120210379);c = ii(c,d,a,b,k[2],15,718787259);b = ii(b,c,d,a,k[9],21,-343485551);
            x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
        }
        function cmn(q,a,b,x,s,t) { a = add32(add32(a,q), add32(x,t)); return add32((a<<s)|(a>>>(32-s)),b); }
        function ff(a,b,c,d,x,s,t) { return cmn((b&c)|((~b)&d),a,b,x,s,t); }
        function gg(a,b,c,d,x,s,t) { return cmn((b&d)|(c&(~d)),a,b,x,s,t); }
        function hh(a,b,c,d,x,s,t) { return cmn(b^c^d,a,b,x,s,t); }
        function ii(a,b,c,d,x,s,t) { return cmn(c^(b|(~d)),a,b,x,s,t); }
        function md51(s) {
            var n = s.length, state = [1732584193,-271733879,-1732584194,271733878], i;
            for (i=64; i<=n; i+=64) { md5cycle(state, md5blk(s.substring(i-64,i))); }
            s = s.substring(i-64);
            var tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
            for (i=0; i<s.length; i++) tail[i>>2] |= s.charCodeAt(i)<<((i%4)<<3);
            tail[i>>2] |= 0x80<<((i%4)<<3);
            if (i>55) { md5cycle(state, tail); tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; }
            tail[14] = n*8;
            md5cycle(state, tail);
            return state;
        }
        function md5blk(s) {
            var md5blks = [], i;
            for (i=0; i<64; i+=4) { md5blks[i>>2] = s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24); }
            return md5blks;
        }
        var hex_chr = '0123456789abcdef'.split('');
        function rhex(n) { var s='',j=0; for(;j<4;j++) s+=hex_chr[(n>>(j*8+4))&0x0F]+hex_chr[(n>>(j*8))&0x0F]; return s; }
        function hex(x) { for(var i=0;i<x.length;i++) x[i]=rhex(x[i]); return x.join(''); }
        function add32(a,b) { return (a+b)&0xFFFFFFFF; }
        return hex(md51(string));
    },

    _copyField(id) {
        const el = document.getElementById(id);
        if (el && el.value) { navigator.clipboard.writeText(el.value); XP.notify('Copied', 'Copied to clipboard'); }
    },

    // ── Image Generator (client-side Canvas) — kept as-is ──
    _gen_image(body) {
        body.innerHTML = `<h3>Placeholder Image</h3>
            <div class="dg-row"><label>Width (px)</label><input class="xp-input" type="number" id="dg-img-w" value="400" min="10" max="2000"></div>
            <div class="dg-row"><label>Height (px)</label><input class="xp-input" type="number" id="dg-img-h" value="300" min="10" max="2000"></div>
            <div class="dg-row"><label>Background</label><input type="color" id="dg-img-bg" value="#3B79E7" style="width:50px;height:24px"></div>
            <div class="dg-row"><label>Text (optional)</label><input class="xp-input" type="text" id="dg-img-text" placeholder="Leave empty for dimensions"></div>
            <div class="dg-actions">
                <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doImage()">Generate</button>
                <button class="xp-btn" onclick="Apps.DummyGenerator._downloadImage()">Download</button>
            </div>
            <div style="margin-top:8px;text-align:center"><canvas id="dg-img-canvas" style="max-width:100%;border:1px solid #d4d0c8"></canvas></div>`;
    },
    _doImage() {
        const w = parseInt(document.getElementById('dg-img-w').value) || 400;
        const h = parseInt(document.getElementById('dg-img-h').value) || 300;
        const bg = document.getElementById('dg-img-bg').value;
        const text = document.getElementById('dg-img-text').value || `${w} \u00D7 ${h}`;
        const canvas = document.getElementById('dg-img-canvas');
        if (!canvas) return;
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
        const fontSize = Math.max(14, Math.min(w, h) / 8);
        ctx.fillStyle = '#fff'; ctx.font = `bold ${fontSize}px Tahoma, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4;
        ctx.fillText(text, w / 2, h / 2);
    },
    _downloadImage() {
        const canvas = document.getElementById('dg-img-canvas');
        if (!canvas || !canvas.width) return;
        const a = document.createElement('a');
        a.download = `placeholder_${canvas.width}x${canvas.height}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
    },

    // ── Avatar Generator (DiceBear API) — kept as-is ──
    _gen_avatar(body) {
        const styles = ['adventurer','adventurer-neutral','avataaars','big-ears','big-smile','bottts','croodles','fun-emoji','icons','identicon','initials','lorelei','micah','miniavs','notionists','open-peeps','personas','pixel-art','thumbs'];
        body.innerHTML = `<h3>Avatar Generator</h3>
            <div class="dg-row"><label>Style</label><select class="xp-select" id="dg-av-style">${styles.map(s => `<option value="${s}">${s}</option>`).join('')}</select></div>
            <div class="dg-row"><label>Count</label><input class="xp-input" type="number" id="dg-av-count" value="8" min="1" max="24"></div>
            <div class="dg-actions">
                <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doAvatar()">Generate</button>
            </div>
            <div id="dg-av-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin-top:10px"></div>`;
    },
    _doAvatar() {
        const style = document.getElementById('dg-av-style').value;
        const count = parseInt(document.getElementById('dg-av-count').value) || 8;
        const grid = document.getElementById('dg-av-grid');
        if (!grid) return;
        grid.innerHTML = Array.from({length: count}, (_, i) => {
            const seed = faker.internet.userName() + i;
            const url = `${BASE_URL}/api/proxy/avatar?style=${style}&seed=${encodeURIComponent(seed)}`;
            return `<div style="text-align:center">
                <img src="${url}" style="width:72px;height:72px;border:1px solid #d4d0c8;border-radius:6px;background:#f5f3e8;cursor:pointer" alt="${seed}"
                     onclick="Apps.DummyGenerator._downloadAvatar('${url}','${esc(seed)}')">
                <div style="font-size:9px;color:#888;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(seed)}</div>
            </div>`;
        }).join('');
    },
    async _downloadAvatar(url, name) {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${name}.svg`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch { XP.notify('Error', 'Failed to download avatar'); }
    },

    // ── QR Code Generator — kept as-is ──
    _gen_qrcode(body) {
        body.innerHTML = `<h3>QR Code Generator</h3>
            <div class="dg-row"><label>Text / URL</label><input class="xp-input" type="text" id="dg-qr-text" value="https://github.com/s4rt4/xp-workspace" style="width:100%"></div>
            <div class="dg-row"><label>Size (px)</label><input class="xp-input" type="number" id="dg-qr-size" value="200" min="50" max="500"></div>
            <div class="dg-row"><label>Color</label><input type="color" id="dg-qr-color" value="#000000" style="width:50px;height:24px"></div>
            <div class="dg-actions">
                <button class="xp-btn xp-btn-primary" onclick="Apps.DummyGenerator._doQR()">Generate</button>
                <button class="xp-btn" onclick="Apps.DummyGenerator._downloadQR()">Download</button>
            </div>
            <div id="dg-qr-output" style="margin-top:10px;text-align:center"></div>`;
        if (typeof QRCode === 'undefined') {
            this._js('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
        }
    },
    _doQR() {
        const text = document.getElementById('dg-qr-text').value || 'Hello';
        const size = parseInt(document.getElementById('dg-qr-size').value) || 200;
        const color = document.getElementById('dg-qr-color').value;
        const output = document.getElementById('dg-qr-output');
        if (!output) return;
        output.innerHTML = '';
        new QRCode(output, {
            text, width: size, height: size,
            colorDark: color, colorLight: '#ffffff',
        });
    },
    _downloadQR() {
        const canvas = document.querySelector('#dg-qr-output canvas');
        if (!canvas) return;
        const a = document.createElement('a');
        a.download = 'qrcode.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
    },
};
