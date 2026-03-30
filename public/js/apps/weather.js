/**
 * Weather App — Check weather for any city
 * Uses OpenWeatherMap API via backend proxy
 */
Apps.Weather = {
    open() {
        XP.createWindow('weather', {
            title: 'Weather',
            icon: 'weather.png',
            width: 420, height: 400,
            toolbar: `
                <input class="xp-input" id="weather-city" placeholder="Enter city name..." style="width:180px" onkeydown="if(event.key==='Enter')Apps.Weather.search()">
                <button class="toolbar-btn" onclick="Apps.Weather.search()"><img src="${ICON_PATH}/search.png" style="width:16px;height:16px" alt=""> Search</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Weather.settings()"><img src="${ICON_PATH}/properties.png" style="width:16px;height:16px" alt="" onerror="this.style.display='none'"> API Key</button>
            `,
            content: `
                <style>
                    .weather-empty { text-align:center; padding:60px 20px; color:#999; }
                    .weather-card { padding:16px; }
                    .weather-header { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
                    .weather-header .w-icon { font-size:40px; }
                    .weather-header .w-city { font-size:18px; font-weight:bold; color:#003c74; }
                    .weather-header .w-desc { font-size:11px; color:#666; text-transform:capitalize; }
                    .weather-temp { font-size:36px; font-weight:bold; color:#003c74; margin-bottom:12px; }
                    .weather-details { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
                    .weather-detail { background:#f5f3e8; border:1px solid #d4d0c8; padding:6px 10px; font-size:11px; }
                    .weather-detail strong { color:#003c74; }
                </style>
                <div id="weather-content">
                    <div class="weather-empty">
                        <img src="${ICON_PATH}/search.png" style="width:40px;height:40px;opacity:0.3" alt="">
                        <div style="margin-top:8px">Enter a city name and click Search</div>
                    </div>
                </div>
            `,
        });
    },

    async search() {
        const city = document.getElementById('weather-city')?.value?.trim();
        if (!city) return;

        const el = document.getElementById('weather-content');
        if (el) el.innerHTML = '<div style="text-align:center;padding:40px;color:#888">Loading...</div>';

        const res = await XP.api(`/api/weather?city=${encodeURIComponent(city)}`);

        if (!res.success || !res.data) {
            if (el) el.innerHTML = `<div class="weather-empty" style="color:#c00">${esc(res.message || 'City not found')}</div>`;
            return;
        }

        const d = res.data;
        const iconMap = { Clear:'☀️', Clouds:'☁️', Rain:'🌧️', Drizzle:'🌦️', Thunderstorm:'⛈️', Snow:'❄️', Mist:'🌫️', Fog:'🌫️', Haze:'🌫️' };
        const icon = iconMap[d.weather?.[0]?.main] || '🌡️';

        el.innerHTML = `
            <div class="weather-card">
                <div class="weather-header">
                    <span class="w-icon">${icon}</span>
                    <div>
                        <div class="w-city">${esc(d.name)}, ${esc(d.sys?.country || '')}</div>
                        <div class="w-desc">${esc(d.weather?.[0]?.description || '')}</div>
                    </div>
                </div>
                <div class="weather-temp">${Math.round(d.main?.temp || 0)}°C</div>
                <div class="weather-details">
                    <div class="weather-detail"><strong>Feels Like</strong><br>${Math.round(d.main?.feels_like || 0)}°C</div>
                    <div class="weather-detail"><strong>Humidity</strong><br>${d.main?.humidity || 0}%</div>
                    <div class="weather-detail"><strong>Wind</strong><br>${d.wind?.speed || 0} m/s</div>
                    <div class="weather-detail"><strong>Pressure</strong><br>${d.main?.pressure || 0} hPa</div>
                    <div class="weather-detail"><strong>Temp Min</strong><br>${Math.round(d.main?.temp_min || 0)}°C</div>
                    <div class="weather-detail"><strong>Temp Max</strong><br>${Math.round(d.main?.temp_max || 0)}°C</div>
                </div>
            </div>`;
    },

    settings() {
        ApiKeys.showSettings('weather', [
            { id: 'openweathermap', name: 'OpenWeatherMap API Key' },
        ]);
    },
};
