# System Tray Icons — Development Guide

## Overview

System tray icons appear at the bottom-right of the taskbar, next to the clock. They provide quick access to system status and app notifications. The tray supports **visible** (always shown) and **hidden** (expandable) icons.

## Architecture

```
.system-tray
├── .tray-expand          ← arrow button to show/hide hidden icons
├── .tray-icons-hidden    ← container for hidden icons
├── .tray-icons           ← container for visible icons
└── #tray-clock           ← clock display
```

The SystemTray module lives in `public/js/desktop.js` under `XP.SystemTray`.

---

## Quick Start

### Adding a Tray Icon from an App

```javascript
// In your app's open() or init() method:
XP.SystemTray.addIcon(
    'myapp',              // unique ID (string)
    'my-icon.png',        // icon filename from /public/icons/
    'My App Status',      // tooltip text
    () => {               // click handler
        // show popup, toggle state, etc.
    },
    true                  // visible: true = always shown, false = hidden (default)
);
```

### Removing a Tray Icon

```javascript
// In your app's onClose handler:
XP.SystemTray.removeIcon('myapp');
```

---

## Full API Reference

### `XP.SystemTray.addIcon(id, icon, title, onClick, visible)`

Register a new tray icon.

| Param     | Type       | Default | Description                                    |
|-----------|------------|---------|------------------------------------------------|
| `id`      | `string`   | —       | Unique identifier. Used for all other API calls |
| `icon`    | `string`   | —       | Filename in `/public/icons/` directory          |
| `title`   | `string`   | —       | Tooltip shown on hover                          |
| `onClick` | `function` | —       | Called when user clicks the icon                |
| `visible` | `boolean`  | `false` | `true` = always shown, `false` = in hidden area |

```javascript
// Example: Music player tray icon
XP.SystemTray.addIcon('musicplayer', 'mp3-player.png', 'Now Playing: Song Name', () => {
    Apps.MusicPlayer.open();
}, true);
```

---

### `XP.SystemTray.removeIcon(id)`

Remove a tray icon by ID.

```javascript
XP.SystemTray.removeIcon('musicplayer');
```

---

### `XP.SystemTray.updateIcon(id, props)`

Update one or more properties of an existing icon.

| Prop    | Type       | Description           |
|---------|------------|-----------------------|
| `icon`  | `string`   | New icon filename     |
| `title` | `string`   | New tooltip text      |

```javascript
// Update tooltip to show current song
XP.SystemTray.updateIcon('musicplayer', {
    title: 'Now Playing: Never Gonna Give You Up'
});

// Change icon based on state
XP.SystemTray.updateIcon('volume', {
    icon: 'volume-alt.png'  // muted icon
});
```

---

### `XP.SystemTray.setBadge(id, count)`

Show a red badge with a number on the icon. Useful for notifications, unread counts, etc.

| Param   | Type     | Description                         |
|---------|----------|-------------------------------------|
| `id`    | `string` | Icon ID                             |
| `count` | `number` | Badge number. `0` removes the badge |

```javascript
// Show 3 unread messages
XP.SystemTray.setBadge('email', 3);

// Clear badge
XP.SystemTray.setBadge('email', 0);
```

> Badge displays `99+` for counts above 99.

---

### `XP.SystemTray.blink(id, on)`

Toggle a blinking animation on the icon. Use sparingly — only for urgent notifications.

| Param | Type      | Description                |
|-------|-----------|----------------------------|
| `id`  | `string`  | Icon ID                    |
| `on`  | `boolean` | `true` to start, `false` to stop |

```javascript
// Start blinking (urgent notification)
XP.SystemTray.blink('email', true);

// Stop blinking
XP.SystemTray.blink('email', false);
```

---

## Creating Tray Popups

Use `XP.SystemTray._createPopup()` to show a styled popup anchored to the tray area.

```javascript
XP.SystemTray._createPopup(
    'My App Status',        // popup title
    'my-icon.png',          // header icon
    `<div>Your HTML content here</div>`  // body HTML
);
```

### Popup CSS Classes

| Class              | Description                        |
|--------------------|------------------------------------|
| `.tray-popup`      | Popup container                    |
| `.tray-popup-header` | Blue gradient header             |
| `.tray-popup-body` | Content area                       |
| `.tray-popup-row`  | Flex row with label + value        |
| `.tray-popup-sep`  | Horizontal separator line          |

### Example: Custom Popup

```javascript
XP.SystemTray.addIcon('weather-tray', 'weather.png', 'Weather: 28°C', () => {
    XP.SystemTray._createPopup('Weather', 'weather.png', `
        <div class="tray-popup-row">
            <label>Temp</label>
            <span>28°C / 82°F</span>
        </div>
        <div class="tray-popup-row">
            <label>Humidity</label>
            <span>65%</span>
        </div>
        <div class="tray-popup-sep"></div>
        <div style="text-align:center">
            <button class="xp-btn" onclick="XP.openApp('weather')">Open Weather App</button>
        </div>
    `);
}, true);
```

---

## Built-in Tray Icons

These are registered automatically on startup:

| ID        | Icon                      | Visible | Description                         |
|-----------|---------------------------|---------|-------------------------------------|
| `volume`  | `volume.png`              | Yes     | Volume control with slider popup    |
| `network` | `network-connection.png`  | Yes     | Network status (online/offline, speed) |
| `battery` | `battery-backup.png`      | No      | Battery level (uses Battery API)    |
| `updates` | `windows-update.png`      | No      | System update status                |
| `shield`  | `network-and-internet.png`| No      | Security center notification        |

---

## Complete App Integration Example

Here's a full example of integrating tray icon into a music player app:

```javascript
Apps.MyPlayer = {
    playing: false,
    trackName: '',

    open() {
        // Add tray icon when app opens
        XP.SystemTray.addIcon('myplayer', 'my-music.png', 'My Player', () => {
            this._showTrayPopup();
        }, true);

        XP.createWindow('myplayer', {
            // ... window config ...
            onClose: () => {
                // Remove tray icon when app closes
                XP.SystemTray.removeIcon('myplayer');
            },
        });
    },

    play(track) {
        this.playing = true;
        this.trackName = track.name;
        // Update tray icon tooltip
        XP.SystemTray.updateIcon('myplayer', {
            title: 'Playing: ' + track.name
        });
    },

    pause() {
        this.playing = false;
        XP.SystemTray.updateIcon('myplayer', {
            title: 'Paused: ' + this.trackName
        });
    },

    _showTrayPopup() {
        XP.SystemTray._createPopup('My Player', 'my-music.png', `
            <div style="text-align:center; padding:6px">
                <div style="font-weight:bold">${this.trackName || 'No track'}</div>
                <div style="margin-top:6px">
                    <button class="xp-btn" onclick="Apps.MyPlayer.${this.playing ? 'pause' : 'play'}()">
                        ${this.playing ? '⏸ Pause' : '▶ Play'}
                    </button>
                </div>
            </div>
        `);
    },
};
```

---

## Available Icons

Common icons in `/public/icons/` suitable for tray use:

**Audio:** `volume.png`, `volume-alt.png`, `volume-level.png`, `audio-devices.png`
**Network:** `network-connection.png`, `wireless-network-connection.png`
**System:** `battery-backup.png`, `windows-update.png`, `scheduled-tasks.png`
**Media:** `mp3-player.png`, `windows-media-player-9.png`, `my-music.png`
**Mail:** `email.png`, `msn-email.png`
**Status:** `information.png`, `error.png`, `warning.png`

---

## Tips

- Use `visible: true` only for important/frequently used icons — too many visible icons clutter the tray
- Always remove your tray icon in the `onClose` callback to prevent orphaned icons
- Use `setBadge()` for notification counts instead of replacing the icon
- Use `blink()` sparingly — it's visually aggressive and should only indicate urgent state
- Popups auto-close when clicking outside — no manual close logic needed
- Only one popup can be open at a time — opening a new one closes the previous
