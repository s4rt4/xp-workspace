/**
 * System Info — Display browser, OS, hardware, and screen information
 */
Apps.SystemInfo = {
    open() {
        if (XP.windows['systeminfo']) { XP.focusWindow('systeminfo'); return; }

        XP.createWindow('systeminfo', {
            title: 'System Information',
            icon: 'my-computer.png',
            width: 520, height: 440,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.SystemInfo.refresh()"><img src="${ICON_PATH}/forward.png" style="width:16px;height:16px" alt=""> Refresh</button>
                <button class="toolbar-btn" onclick="Apps.SystemInfo.copyAll()"><img src="${ICON_PATH}/copy.png" style="width:16px;height:16px" alt=""> Copy All</button>
            `,
            content: '<div id="si-body" style="padding:8px;font-size:11px;overflow-y:auto;height:100%">Loading...</div>',
            onReady: () => this.refresh(),
        });
    },

    async refresh() {
        const el = document.getElementById('si-body');
        if (!el) return;

        const ua = navigator.userAgent;
        const platform = navigator.platform || 'Unknown';
        const lang = navigator.language;
        const cores = navigator.hardwareConcurrency || 'N/A';
        const devMem = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'N/A';
        const online = navigator.onLine ? 'Online' : 'Offline';
        const cookieEnabled = navigator.cookieEnabled ? 'Yes' : 'No';
        const dpr = window.devicePixelRatio || 1;
        const screen = `${window.screen.width}×${window.screen.height}`;
        const viewport = `${window.innerWidth}×${window.innerHeight}`;
        const colorDepth = window.screen.colorDepth + '-bit';
        const conn = navigator.connection || {};
        const netType = conn.effectiveType || 'Unknown';
        const netDown = conn.downlink ? conn.downlink + ' Mbps' : 'N/A';

        // GPU
        let gpuRenderer = 'N/A', gpuVendor = 'N/A';
        try {
            const c = document.createElement('canvas');
            const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
            if (gl) {
                const ext = gl.getExtension('WEBGL_debug_renderer_info');
                if (ext) {
                    gpuRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
                    gpuVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
                }
            }
        } catch {}

        // Browser detect
        let browser = 'Unknown';
        if (ua.includes('Firefox/')) browser = 'Firefox ' + ua.split('Firefox/')[1];
        else if (ua.includes('Edg/')) browser = 'Edge ' + ua.split('Edg/')[1];
        else if (ua.includes('Chrome/')) browser = 'Chrome ' + ua.split('Chrome/')[1].split(' ')[0];
        else if (ua.includes('Safari/')) browser = 'Safari';

        // OS detect
        let os = 'Unknown';
        if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
        else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
        else if (ua.includes('Mac OS X')) os = 'macOS ' + ua.match(/Mac OS X ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || '';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iOS')) os = 'iOS';

        // Memory
        let jsHeap = 'N/A', jsHeapTotal = 'N/A';
        if (performance.memory) {
            jsHeap = this._fmt(performance.memory.usedJSHeapSize);
            jsHeapTotal = this._fmt(performance.memory.jsHeapSizeLimit);
        }

        // Battery
        let batteryInfo = 'N/A';
        try {
            if ('getBattery' in navigator) {
                const bat = await navigator.getBattery();
                batteryInfo = Math.round(bat.level * 100) + '%' + (bat.charging ? ' (Charging)' : '');
            }
        } catch {}

        // Storage
        let storageInfo = 'N/A';
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const est = await navigator.storage.estimate();
                storageInfo = `${this._fmt(est.usage)} / ${this._fmt(est.quota)}`;
            }
        } catch {}

        const lsSize = this._fmt(new Blob(Object.values(localStorage)).size);

        const section = (title, rows) => {
            let html = `<div style="font-weight:bold;color:#003c74;padding:6px 0 3px;border-bottom:1px solid #d4d0c8;margin-top:8px">${title}</div>`;
            html += '<table style="width:100%;border-collapse:collapse">';
            rows.forEach(([k, v]) => {
                html += `<tr><td style="padding:2px 8px;color:#666;width:140px;white-space:nowrap">${k}</td><td style="padding:2px 8px;word-break:break-all">${v}</td></tr>`;
            });
            html += '</table>';
            return html;
        };

        el.innerHTML =
            section('Operating System', [['OS', os], ['Platform', platform], ['Language', lang]]) +
            section('Browser', [['Browser', browser], ['Cookies', cookieEnabled], ['User Agent', `<span style="font-size:9px;color:#888">${ua}</span>`]]) +
            section('Hardware', [['CPU Cores', cores], ['Device Memory', devMem], ['Battery', batteryInfo]]) +
            section('GPU', [['Renderer', gpuRenderer], ['Vendor', gpuVendor]]) +
            section('Display', [['Screen', screen], ['Viewport', viewport], ['Pixel Ratio', dpr + 'x'], ['Color Depth', colorDepth]]) +
            section('Memory', [['JS Heap Used', jsHeap], ['JS Heap Limit', jsHeapTotal], ['LocalStorage', lsSize]]) +
            section('Network', [['Status', online], ['Type', netType], ['Downlink', netDown], ['Storage Estimate', storageInfo]]);
    },

    copyAll() {
        const el = document.getElementById('si-body');
        if (el) navigator.clipboard.writeText(el.innerText);
        XP.notify('System Info', 'Copied to clipboard');
    },

    _fmt(b) {
        if (!b) return 'N/A';
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
        return (b / 1073741824).toFixed(2) + ' GB';
    },
};
