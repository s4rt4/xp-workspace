/**
 * Currency Converter App — Multi-provider currency conversion
 */
Apps.Currency = {
    currencies: [
        ['USD','US Dollar'],['EUR','Euro'],['IDR','Indonesian Rupiah'],['JPY','Japanese Yen'],
        ['GBP','British Pound'],['AUD','Australian Dollar'],['CAD','Canadian Dollar'],['CHF','Swiss Franc'],
        ['CNY','Chinese Yuan'],['SGD','Singapore Dollar'],['HKD','Hong Kong Dollar'],['KRW','Korean Won'],
        ['MYR','Malaysian Ringgit'],['THB','Thai Baht'],['INR','Indian Rupee'],
    ],
    providers: [
        ['exchangerate-api','ExchangeRate-API'],['currencyapi','CurrencyAPI'],['fixer','Fixer.io'],['fxratesapi','FXRatesAPI'],
    ],

    open() {
        const currOpts = this.currencies.map(([c,n]) => `<option value="${c}">${c} — ${n}</option>`).join('');
        const provOpts = this.providers.map(([v,n]) => `<option value="${v}">${n}</option>`).join('');
        XP.createWindow('currency', {
            title: 'Currency Converter',
            icon: 'currency-converter.png',
            width: 440, height: 380,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Currency.settings()"><img src="${ICON_PATH}/properties.png" style="width:16px;height:16px" alt="" onerror="this.style.display='none'"> API Keys</button>
            `,
            content: `
                <style>
                    .cur-form { padding:8px; }
                    .cur-row { display:flex; gap:8px; margin-bottom:8px; align-items:flex-end; }
                    .cur-field { flex:1; }
                    .cur-field label { display:block; font-size:10px; color:#666; margin-bottom:2px; }
                    .cur-swap { background:var(--xp-btn-face); border:1px solid #999; padding:4px 8px; cursor:pointer; font-size:14px; min-width:0; min-height:0; box-shadow:none; align-self:center; margin-top:12px; }
                    .cur-result { margin-top:12px; padding:16px; background:#f0f8ff; border:1px solid #c8d8e8; text-align:center; }
                    .cur-result .cur-amount { font-size:28px; font-weight:bold; color:#003c74; }
                    .cur-result .cur-rate { font-size:11px; color:#666; margin-top:4px; }
                    .cur-result .cur-provider { font-size:10px; color:#999; margin-top:4px; }
                </style>
                <div class="cur-form">
                    <div class="cur-row">
                        <div class="cur-field">
                            <label>Amount</label>
                            <input class="xp-input" id="cur-amount" type="number" value="100" min="0" style="width:100%">
                        </div>
                        <div class="cur-field">
                            <label>Provider</label>
                            <select class="xp-select" id="cur-provider" style="width:100%">${provOpts}</select>
                        </div>
                    </div>
                    <div class="cur-row">
                        <div class="cur-field">
                            <label>From</label>
                            <select class="xp-select" id="cur-from" style="width:100%">${currOpts}</select>
                        </div>
                        <button class="cur-swap" onclick="Apps.Currency.swap()" title="Swap">⇄</button>
                        <div class="cur-field">
                            <label>To</label>
                            <select class="xp-select" id="cur-to" style="width:100%">${currOpts.replace('value="IDR"','value="IDR" selected')}</select>
                        </div>
                    </div>
                    <button class="xp-btn xp-btn-primary" onclick="Apps.Currency.convert()" style="width:100%">Convert</button>
                    <div id="cur-result"></div>
                </div>
            `,
        });
    },

    swap() {
        const f = document.getElementById('cur-from'), t = document.getElementById('cur-to');
        if (f && t) { const tmp = f.value; f.value = t.value; t.value = tmp; }
    },

    async convert() {
        const amount = parseFloat(document.getElementById('cur-amount')?.value) || 0;
        const from = document.getElementById('cur-from')?.value;
        const to = document.getElementById('cur-to')?.value;
        const provider = document.getElementById('cur-provider')?.value;
        const el = document.getElementById('cur-result');

        if (!amount || !from || !to) return;
        if (el) el.innerHTML = '<div style="text-align:center;padding:16px;color:#888">Converting...</div>';

        const res = await XP.api('/api/currency/convert', 'POST', { from, to, amount, provider });

        if (res.success && res.data) {
            const d = res.data;
            const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
            el.innerHTML = `
                <div class="cur-result">
                    <div class="cur-amount">${fmt.format(d.result)} ${d.to}</div>
                    <div class="cur-rate">1 ${d.from} = ${fmt.format(d.rate)} ${d.to}</div>
                    <div class="cur-provider">via ${esc(d.provider)}</div>
                </div>`;
        } else {
            el.innerHTML = `<div style="text-align:center;padding:12px;color:#c00;font-size:11px">${esc(res.message || 'Conversion failed')}</div>`;
        }
    },

    settings() {
        ApiKeys.showSettings('currency', [
            { id: 'exchangerate-api', name: 'ExchangeRate-API' },
            { id: 'currencyapi', name: 'CurrencyAPI' },
            { id: 'fixer', name: 'Fixer.io' },
            { id: 'fxratesapi', name: 'FXRatesAPI' },
        ]);
    },
};
