/**
 * Arah Kiblat — Qibla compass using Geolocation API
 */
Apps.QiblaCompass = {
    _lat: null, _lng: null, _qiblaAngle: 0,

    open() {
        if (XP.windows['qiblacompass']) { XP.focusWindow('qiblacompass'); return; }
        XP.createWindow('qiblacompass', {
            title: 'Arah Kiblat',
            icon: 'quran.png',
            width: 340, height: 420,
            resizable: false,
            content: `
                <style>
                    .qb-wrap{text-align:center;padding:12px;background:linear-gradient(180deg,#1a472a,#0d2818);color:#fff;height:100%;display:flex;flex-direction:column;align-items:center}
                    .qb-compass{position:relative;width:220px;height:220px;margin:12px 0}
                    .qb-compass canvas{width:220px;height:220px}
                    .qb-info{font-size:18px;font-weight:bold;margin:8px 0}
                    .qb-coords{font-size:10px;color:#a0d8b4;margin:4px 0}
                    .qb-status{font-size:11px;color:#888;margin-top:8px}
                    .qb-kaaba{font-size:12px;margin-top:4px;color:#f0c040}
                    .qb-manual{margin-top:10px;font-size:10px}
                    .qb-manual input{width:70px;font-size:10px;text-align:center}
                </style>
                <div class="qb-wrap">
                    <div style="font-size:24px;margin-bottom:4px">🕋</div>
                    <div style="font-size:13px;font-weight:bold">Arah Kiblat</div>
                    <div class="qb-compass"><canvas id="qb-canvas" width="440" height="440"></canvas></div>
                    <div class="qb-info" id="qb-angle">—°</div>
                    <div class="qb-kaaba" id="qb-kaaba">Locating...</div>
                    <div class="qb-coords" id="qb-coords"></div>
                    <div class="qb-status" id="qb-status">Getting your location...</div>
                    <div class="qb-manual">
                        Manual: <input class="xp-input" id="qb-lat" placeholder="Latitude" style="background:#1a3a2a;color:#fff;border-color:#2a5a3a">
                        <input class="xp-input" id="qb-lng" placeholder="Longitude" style="background:#1a3a2a;color:#fff;border-color:#2a5a3a">
                        <button class="xp-btn" onclick="Apps.QiblaCompass.manualCalc()" style="font-size:9px;padding:2px 6px;min-width:0;min-height:0;box-shadow:none">Calc</button>
                    </div>
                </div>
            `,
            onReady: () => this._getLocation(),
        });
    },

    _getLocation() {
        if (!navigator.geolocation) { document.getElementById('qb-status').textContent = 'Geolocation not supported'; return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => { this._lat = pos.coords.latitude; this._lng = pos.coords.longitude; this._calculate(); },
            (err) => { document.getElementById('qb-status').textContent = 'Location denied. Enter manually.'; }
        );
    },

    manualCalc() {
        const lat = parseFloat(document.getElementById('qb-lat').value);
        const lng = parseFloat(document.getElementById('qb-lng').value);
        if (isNaN(lat) || isNaN(lng)) return;
        this._lat = lat; this._lng = lng; this._calculate();
    },

    _calculate() {
        // Kaaba coordinates
        const kLat = 21.4225, kLng = 39.8262;
        const lat1 = this._lat * Math.PI / 180, lat2 = kLat * Math.PI / 180;
        const dLng = (kLng - this._lng) * Math.PI / 180;
        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        let angle = Math.atan2(y, x) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        this._qiblaAngle = angle;

        // Distance
        const R = 6371;
        const dLat = (kLat - this._lat) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2)**2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        document.getElementById('qb-angle').textContent = angle.toFixed(1) + '°';
        document.getElementById('qb-kaaba').textContent = `${dist.toFixed(0)} km to Makkah`;
        document.getElementById('qb-coords').textContent = `${this._lat.toFixed(4)}°, ${this._lng.toFixed(4)}°`;
        document.getElementById('qb-status').textContent = this._getDirection(angle);
        this._drawCompass();
    },

    _getDirection(a) {
        const dirs = ['North','NNE','NE','ENE','East','ESE','SE','SSE','South','SSW','SW','WSW','West','WNW','NW','NNW'];
        return dirs[Math.round(a / 22.5) % 16];
    },

    _drawCompass() {
        const canvas = document.getElementById('qb-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, C = W / 2, R = C - 20;

        ctx.clearRect(0, 0, W, W);

        // Outer circle
        ctx.beginPath(); ctx.arc(C, C, R, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();

        // Direction marks
        const dirs = ['N','E','S','W'];
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 16px Tahoma'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        dirs.forEach((d, i) => {
            const a = (i * 90 - 90) * Math.PI / 180;
            ctx.fillText(d, C + (R - 18) * Math.cos(a), C + (R - 18) * Math.sin(a));
        });

        // Degree marks
        for (let i = 0; i < 360; i += 10) {
            const a = (i - 90) * Math.PI / 180;
            const inner = i % 30 === 0 ? R - 35 : R - 30;
            ctx.beginPath();
            ctx.moveTo(C + inner * Math.cos(a), C + inner * Math.sin(a));
            ctx.lineTo(C + (R - 8) * Math.cos(a), C + (R - 8) * Math.sin(a));
            ctx.strokeStyle = i % 30 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = i % 30 === 0 ? 1.5 : 0.5;
            ctx.stroke();
        }

        // Qibla arrow
        const qa = (this._qiblaAngle - 90) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(C + (R - 40) * Math.cos(qa), C + (R - 40) * Math.sin(qa));
        // Arrow head
        const tipX = C + (R - 40) * Math.cos(qa), tipY = C + (R - 40) * Math.sin(qa);
        const baseX = C - 20 * Math.cos(qa), baseY = C - 20 * Math.sin(qa);
        const perpA = qa + Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(baseX + 10 * Math.cos(perpA), baseY + 10 * Math.sin(perpA));
        ctx.lineTo(baseX - 10 * Math.cos(perpA), baseY - 10 * Math.sin(perpA));
        ctx.closePath();
        ctx.fillStyle = '#27ae60'; ctx.fill();

        // Line from center to tip
        ctx.beginPath(); ctx.moveTo(C, C); ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();

        // Center dot
        ctx.beginPath(); ctx.arc(C, C, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#27ae60'; ctx.fill();

        // Kaaba emoji at tip
        ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🕋', C + (R - 55) * Math.cos(qa), C + (R - 55) * Math.sin(qa));
    },
};
