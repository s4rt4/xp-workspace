/**
 * Hijri Calendar — Islamic calendar with Hijri ↔ Gregorian conversion
 */
Apps.HijriCalendar = {
    _hMonth: 0, _hYear: 0,

    open() {
        if (XP.windows['hijricalendar']) { XP.focusWindow('hijricalendar'); return; }
        XP.createWindow('hijricalendar', {
            title: 'Hijri Calendar',
            icon: 'date-and-time.png',
            width: 380, height: 440,
            resizable: false,
            content: `
                <style>
                    .hc-wrap{padding:10px;font-size:11px}
                    .hc-today{text-align:center;padding:10px;background:#1a472a;color:#fff;border-radius:6px;margin-bottom:10px}
                    .hc-today .hc-hijri{font-size:18px;font-weight:bold}
                    .hc-today .hc-greg{font-size:11px;color:#a0d8b4;margin-top:2px}
                    .hc-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
                    .hc-nav-btn{cursor:pointer;padding:2px 8px;border-radius:3px;color:#003c74;font-weight:bold}
                    .hc-nav-btn:hover{background:#e8f0fe}
                    .hc-nav-title{font-weight:bold;color:#003c74}
                    .hc-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;text-align:center}
                    .hc-dh{font-size:9px;color:#888;padding:4px 0;font-weight:bold}
                    .hc-day{padding:5px 0;border-radius:3px;cursor:default;font-size:11px}
                    .hc-day.today{background:#1a472a;color:#fff;font-weight:bold;border-radius:50%}
                    .hc-day.empty{visibility:hidden}
                    .hc-sep{border-top:1px solid #d4d0c8;margin:10px 0}
                    .hc-conv{display:flex;gap:6px;align-items:flex-end}
                    .hc-conv label{font-size:10px;color:#666;display:block;margin-bottom:1px}
                    .hc-conv input{width:60px;font-size:11px}
                    .hc-result{margin-top:6px;padding:6px;background:#f5f3e8;border:1px solid #d4d0c8;font-size:11px;text-align:center;border-radius:3px}
                </style>
                <div class="hc-wrap">
                    <div class="hc-today" id="hc-today"></div>
                    <div class="hc-nav">
                        <span class="hc-nav-btn" onclick="Apps.HijriCalendar.nav(-1)">◀</span>
                        <span class="hc-nav-title" id="hc-title"></span>
                        <span class="hc-nav-btn" onclick="Apps.HijriCalendar.nav(1)">▶</span>
                    </div>
                    <div class="hc-grid" id="hc-grid"></div>
                    <div class="hc-sep"></div>
                    <div><strong style="font-size:10px;color:#666">CONVERTER</strong></div>
                    <div class="hc-conv" style="margin-top:4px">
                        <div><label>Day</label><input class="xp-input" id="hc-cd" type="number" min="1" max="31" value="${new Date().getDate()}"></div>
                        <div><label>Month</label><input class="xp-input" id="hc-cm" type="number" min="1" max="12" value="${new Date().getMonth()+1}"></div>
                        <div><label>Year</label><input class="xp-input" id="hc-cy" type="number" value="${new Date().getFullYear()}" style="width:55px"></div>
                        <button class="xp-btn" onclick="Apps.HijriCalendar.convert()" style="font-size:10px">→ Hijri</button>
                    </div>
                    <div class="hc-result" id="hc-result"></div>
                </div>
            `,
            onReady: () => { const h = this._toHijri(new Date()); this._hMonth = h.month - 1; this._hYear = h.year; this._render(); },
        });
    },

    nav(dir) { this._hMonth += dir; if (this._hMonth > 11) { this._hMonth = 0; this._hYear++; } if (this._hMonth < 0) { this._hMonth = 11; this._hYear--; } this._render(); },

    _render() {
        const today = this._toHijri(new Date());
        const months = ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhul Qadah','Dhul Hijjah'];

        document.getElementById('hc-today').innerHTML = `<div class="hc-hijri">${today.day} ${months[today.month-1]} ${today.year} H</div><div class="hc-greg">${new Date().toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>`;
        document.getElementById('hc-title').textContent = `${months[this._hMonth]} ${this._hYear} H`;

        const daysInMonth = this._hijriMonthDays(this._hYear, this._hMonth + 1);
        const firstGreg = this._toGregorian(this._hYear, this._hMonth + 1, 1);
        const firstDay = firstGreg.getDay();

        let html = ['Ah','Se','Se','Ra','Ka','Ju','Sa'].map(d => `<span class="hc-dh">${d}</span>`).join('');
        for (let i = 0; i < firstDay; i++) html += '<span class="hc-day empty"></span>';
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === today.day && this._hMonth === today.month - 1 && this._hYear === today.year;
            html += `<span class="hc-day${isToday ? ' today' : ''}">${d}</span>`;
        }
        document.getElementById('hc-grid').innerHTML = html;
    },

    convert() {
        const d = +document.getElementById('hc-cd').value, m = +document.getElementById('hc-cm').value, y = +document.getElementById('hc-cy').value;
        const h = this._toHijri(new Date(y, m - 1, d));
        const months = ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhul Qadah','Dhul Hijjah'];
        document.getElementById('hc-result').innerHTML = `${d}/${m}/${y} = <strong>${h.day} ${months[h.month-1]} ${h.year} H</strong>`;
    },

    // Hijri conversion (Umm al-Qura approximation)
    _toHijri(date) {
        const jd = Math.floor((date.getTime() / 86400000) + 2440587.5);
        const l = jd - 1948440 + 10632;
        const n = Math.floor((l - 1) / 10631);
        const l2 = l - 10631 * n + 354;
        const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
        const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
        const month = Math.floor((24 * l3) / 709);
        const day = l3 - Math.floor((709 * month) / 24);
        const year = 30 * n + j - 30;
        return { year, month, day };
    },

    _toGregorian(hy, hm, hd) {
        const jd = Math.floor((11 * hy + 3) / 30) + 354 * hy + 30 * hm - Math.floor((hm - 1) / 2) + hd + 1948440 - 385;
        const d = new Date((jd - 2440587.5) * 86400000);
        return d;
    },

    _hijriMonthDays(hy, hm) { return hm <= 0 ? 30 : (hm % 2 === 1 ? 30 : (hm === 12 && this._isHijriLeap(hy) ? 30 : 29)); },
    _isHijriLeap(y) { return [2,5,7,10,13,16,18,21,24,26,29].includes(y % 30); },
};
