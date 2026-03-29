# XP Workspace — Next Development Plan

## App Integration from Existing Projects

20 project akan di-embed ke XP Workspace sebagai app/module baru. Semua UI disesuaikan dengan tema Windows XP, arsitektur MVC, dan API key disimpan di database.

---

### Kategori & Mapping

#### PRODUCTIVITY (7 apps)

| # | App Name | Source Project | XP Icon | Deskripsi |
|---|----------|---------------|---------|-----------|
| 1 | **Notepad** | Mini_Text_Editor | `notepad.png` | Code editor HTML/CSS/JS dengan live preview. *Menggantikan plan "Notepad App" di Phase 2.* |
| 2 | **File Generator** | File_Generator | `generic-document.png` | Buat & edit file dengan syntax highlighting (28+ bahasa). CodeMirror based. |
| 3 | **CSV Viewer** | CSV_Viewer | `spreadsheet.png` | Multi-format data viewer (CSV, JSON, Excel, Markdown, Log). Pecah jadi sub-tabs di satu window. |
| 4 | **Invoice Sorter** | invoice-app | `receipt.png` | Browse, preview, reorder, dan annotate PDF invoices. |
| 5 | **Todo List** | todolist | `checklist.png` | Task manager sederhana dengan localStorage. *Pertimbangkan merge dengan Task Board existing atau jadikan lightweight alternative.* |
| 6 | **PDF Flipbook** | pdf-flipbook | `generic-document.png` | PDF viewer dengan animasi flip halaman, thumbnail, search, screenshot. |
| 7 | **Translator** | translator | `language.png` | Multi-provider translator (Google, DeepL, Microsoft, MyMemory). **API keys → database.** |

#### UTILITIES (6 apps)

| # | App Name | Source Project | XP Icon | Deskripsi |
|---|----------|---------------|---------|-----------|
| 8 | **Calculator** | kalkulator + kalkulator-v2 | `calculator.png` | Gabung: basic calculator (dari `kalkulator`) + 16 advanced calculators (dari `kalkulator-v2`). *kalkulator-serbaguna dieliminasi karena v2 lebih lengkap.* |
| 9 | **Currency Converter** | Currency | `money.png` | Konversi mata uang multi-provider. **API keys → database.** Flags SVG tetap. |
| 10 | **Hash Generator** | hator | `security-settings.png` | Generate & verify hash (Bcrypt, SHA-256, MD5). PHP backend. |
| 11 | **Dummy Generator** | DummyGator | `administrative-tools.png` | Generator data dummy (11 tabs: image, avatar, text, person, username, location, company, ecommerce, QR, security, finance). Pecah jadi sub-modules. |
| 12 | **Image Tools** | compress | `bitmap.png` | Batch image compressor, cropper, resizer. Client-side Canvas + API proxies. **API keys → database.** |
| 13 | **Weather** | cuaca | `weather.png` | Cek cuaca kota manapun. OpenWeatherMap API. **API key → database.** *Menggantikan plan "Dashboard widget weather".* |

#### MEDIA & ENTERTAINMENT (4 apps)

| # | App Name | Source Project | XP Icon | Deskripsi |
|---|----------|---------------|---------|-----------|
| 14 | **TV Player** | minitv | `windows-media-player-10.png` | Streaming TV Indonesia & internasional via HLS. Channel sidebar. |
| 15 | **Radio** | radio | `audio-cd.png` | Radio streaming 150+ station (Indonesia + internasional). Audio visualizer. |
| 16 | **Piano** | piano | `midi.png` | Virtual piano 13 keys, 3 audio library, keyboard shortcuts. |
| 17 | **Tetris** | tetris | `minesweeper.png` | Classic Tetris game. *Menggantikan plan "Minesweeper" di Phase 4 — game slot sudah terisi.* |

#### ISLAMIC / REFERENCE (1 app, bisa pecah)

| # | App Name | Source Project | XP Icon | Deskripsi |
|---|----------|---------------|---------|-----------|
| 18 | **Quran** | quranku | `book.png` | Digital Quran: baca, dengar, tafsir, doa, jadwal shalat, AI search. Ini app besar — bisa pecah jadi sub-views dalam satu window. |

---

### Eliminasi & Merge dari Plan Sebelumnya

| Plan Lama | Keputusan | Alasan |
|-----------|-----------|--------|
| Phase 2: Notepad App | **Diganti** → Mini_Text_Editor | Sudah ada code editor yang lebih lengkap |
| Phase 2: Pomodoro Timer | **Tetap planned** | Tidak ada project yang cover ini |
| Phase 2: Calendar | **Tetap planned** | Quranku punya jadwal shalat tapi beda fungsi |
| Phase 2: Contacts | **Tetap planned** | Tidak ada project yang cover ini |
| Phase 2: Terminal | **Tetap planned** | Tidak ada project yang cover ini |
| Phase 3: Global Search | **Tetap planned** | Bisa leverage Quranku search pattern |
| Phase 4: Minesweeper | **Diganti** → Tetris | Game slot sudah terisi |
| Phase 4: Dashboard weather widget | **Diganti** → Weather app | Sudah ada app cuaca lengkap |
| Todo List vs Task Board | **Keduanya hidup** | Todo = quick personal, Task Board = project kanban |

---

### API Keys yang Perlu Migrasi ke Database

Buat tabel `api_keys` di database:

```sql
CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    `key` TEXT NOT NULL,
    extra JSON DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| App | Provider | Key Source |
|-----|----------|-----------|
| Currency Converter | exchangerate-api | `converter.php` |
| Currency Converter | currencyapi | `converter.php` |
| Currency Converter | fixer | `converter.php` |
| Currency Converter | fxratesapi | `converter.php` |
| Translator | google | `translator.php` |
| Translator | deepl | `translator.php` |
| Translator | microsoft | `translator.php` |
| Translator | mymemory | `translator.php` |
| Weather | openweathermap | `index.html` inline |
| Image Tools | tinypng | `proxy_tinypng.php` |
| Image Tools | tinypng2 | `proxy_tinypng2.php` |
| Image Tools | imagekit | `proxy_imagekit.php` |
| Image Tools | cloudinary | `proxy_cloudinary.php` |
| Image Tools | shortpixel | `proxy_shortpixel.php` |
| Image Tools | ewww | `proxy_ewww.php` |
| Image Tools | imagify | `proxy_imagify.php` |
| Image Tools | kraken | `proxy_kraken.php` |

---

### JSON Data Files yang Tetap JSON

| App | File | Alasan tetap JSON |
|-----|------|-------------------|
| Radio | `stations.js`, `stations2.js` | Static channel list, no secrets |
| TV Player | `channels.js` | Static channel list, no secrets |
| Quranku | API responses di-cache | Data dari public API equran.id |
| DummyGator | Faker.js data | Client-side library |

---

### Arsitektur per App (MVC Pattern)

Setiap app yang di-embed mengikuti pattern:

```
app/
├── controllers/
│   └── {App}Controller.php      ← API endpoint handler
├── models/
│   └── {App}.php                ← Data/business logic (jika perlu)
├── views/
│   └── apps/
│       └── {app}.php            ← HTML template (optional, bisa inline di JS)
config/
│   └── routes.php               ← Tambah route baru
public/
├── js/
│   └── apps/
│       └── {app}.js             ← Frontend logic (XP window integration)
├── css/
│   └── apps/
│       └── {app}.css            ← App-specific styles (XP themed)
├── data/
│   └── {app}/                   ← JSON/static data files
└── vendor/
    └── {lib}.min.js             ← Third-party libs (CodeMirror, HLS.js, etc.)
```

**UI Rules:**
- Semua app dibuka via `XP.createWindow()`
- Toolbar pakai `.toolbar-btn` dengan XP icons
- Form elements pakai `.xp-input`, `.xp-select`, `.xp-btn`
- Tabs pakai `.xp-tabs` / `.xp-tab`
- Tables pakai `.xp-listview`
- Dialogs pakai `XP.dialog()`
- Notifications pakai `XP.notify()`

---

### Prioritas Implementasi

#### Batch 1 — Quick Wins (client-side only, no API)
1. Calculator (kalkulator + kalkulator-v2)
2. Todo List
3. Piano
4. Tetris
5. Hash Generator

#### Batch 2 — Medium (perlu sedikit backend)
6. Notepad (Mini_Text_Editor)
7. File Generator
8. CSV Viewer
9. PDF Flipbook
10. Dummy Generator

#### Batch 3 — API-dependent (perlu migrasi API keys)
11. Weather
12. Currency Converter
13. Translator
14. Image Tools

#### Batch 4 — Complex (banyak sub-module)
15. TV Player
16. Radio
17. Invoice Sorter
18. Quran

---

### Third-party Libraries yang Perlu Di-bundle

Download ke `public/vendor/` (bukan CDN) untuk konsistensi:

| Library | Digunakan oleh | Size |
|---------|---------------|------|
| CodeMirror 5.65 | Notepad, File Generator | ~300KB |
| HLS.js | TV Player, Radio | ~50KB |
| PapaParse | CSV Viewer | ~20KB |
| XLSX.js | CSV Viewer | ~300KB |
| Marked.js | CSV Viewer, Wiki | ~30KB |
| DataTables + jQuery | CSV Viewer | ~200KB |
| PDF.js | PDF Flipbook, Invoice | ~400KB |
| Page-Flip.js | PDF Flipbook | ~30KB |
| jsPDF | CSV Viewer, PDF export | ~100KB |
| html2canvas | PDF Flipbook, CSV | ~40KB |
| Faker.js | Dummy Generator | ~200KB |
| QRCode.js | Dummy Generator | ~15KB |
| Tone.js | Piano | ~150KB |
| Howler.js | Piano | ~10KB |
| SortableJS | Invoice Sorter | ~15KB |
| Lucide Icons | Quranku | ~50KB |
| NES.css | Tetris | ~15KB |

---

### Estimasi Total: 18 apps baru → XP Workspace menjadi 24 apps (6 existing + 18 baru)

Start Menu akan di-reorganisasi ke groups:
- **Productivity** — Dashboard, Projects, Tasks, Wiki, Files, Notes, Notepad, File Generator, CSV Viewer, Invoice, Todo, PDF Flipbook
- **Utilities** — Calculator, Currency, Hash, Dummy Generator, Image Tools, Weather, Translator
- **Media** — TV Player, Radio, Piano
- **Games** — Tetris
- **Islamic** — Quran
