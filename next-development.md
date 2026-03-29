# XP Workspace — Next Development Plan

## Phase 1: Polish & Complete Core (Priority: High)

### 1.1 Task Comments & Checklists
- Tabel `task_comments` dan `task_checklists` sudah ada di database
- Buat API endpoints: `POST/GET /api/tasks/{id}/comments`, `POST/PUT/DELETE /api/tasks/{id}/checklists`
- Tambah UI checklist di task detail dialog (centang sub-task)
- Tambah comment section di task detail (timeline style)

### 1.2 File Preview & Linking
- Preview gambar (jpg, png, gif) langsung di File Manager
- Preview text/code files dengan syntax highlighting
- Link file ke task atau wiki page (field `linked_type`, `linked_id` sudah ada)
- Drag-drop upload ke window File Manager

### 1.3 Wiki Improvements
- Markdown rendering yang lebih lengkap (code blocks, images, links, blockquote)
- Atau integrasi library ringan seperti marked.js
- Tree view dengan expand/collapse untuk halaman berhierarki (parent_id sudah ada)
- Wiki tags UI — tambah/hapus tag di halaman wiki
- Export wiki page ke PDF/HTML

### 1.4 Desktop Experience Polish
- Drag desktop icons (reposition & save)
- Wallpaper preference disimpan ke database (persist setelah reload)
- Theme preference disimpan ke database
- Window position & size memory (reopen di posisi terakhir)
- Keyboard shortcuts: Alt+F4 close, Alt+Tab switch window

---

## Phase 2: New Modules (Priority: Medium)

### 2.1 Calendar Module
- Tampilan bulan/minggu/hari
- Integrasi dengan task due dates (tampil otomatis di kalender)
- Buat event mandiri (meeting, reminder)
- Notifikasi untuk event hari ini saat boot

### 2.2 Contacts / Address Book
- CRUD kontak (nama, email, telepon, catatan)
- Link kontak ke task assignee
- Tampilan list view dan detail view
- Import/export CSV

### 2.3 Terminal / Command Prompt
- Window dengan tampilan command prompt XP
- Jalankan quick actions: `create project "Name"`, `list tasks`, `search wiki "query"`
- Easter egg commands: `dir`, `cls`, `ver`, `color`
- History dengan arrow up/down

### 2.4 Pomodoro Timer
- Timer 25/5 menit dengan tampilan XP
- Link ke task yang sedang dikerjakan
- Statistik: berapa pomodoro per hari/minggu
- Sound notification saat selesai (pakai XP sounds)

### 2.5 Notepad App (Full Editor)
- Standalone text editor window (bukan sticky note)
- Open/save file dari File Manager
- Find & replace
- Word wrap toggle
- Tampilan mirip Notepad.exe asli XP

---

## Phase 3: Advanced Features (Priority: Low)

### 3.1 Multi-User & Authentication
- Login screen (mirip XP welcome screen dengan avatar)
- User management (admin bisa tambah user)
- Per-user preferences, notes, dan workspace
- Role-based access (admin, member, viewer)

### 3.2 Real-time & Collaboration
- WebSocket untuk live update (task moved, note edited)
- Presence indicator (siapa yang online)
- Activity feed real-time di dashboard
- Notification center di system tray

### 3.3 Gantt Chart View
- Timeline view untuk tasks berdasarkan due date
- Drag untuk adjust duration
- Dependencies antar task (task A harus selesai sebelum B)
- Tampilan per project

### 3.4 Search Everything
- Global search dari taskbar (mirip Windows Search)
- Cari di semua module: projects, tasks, wiki, files, notes
- Search-as-you-type dengan dropdown results
- Recent searches history

### 3.5 Import/Export & Backup
- Export seluruh workspace ke ZIP (database + files)
- Import dari ZIP backup
- Export project ke JSON
- Export wiki ke Markdown files

### 3.6 Dashboard Widgets
- Dashboard customizable dengan drag-drop widgets
- Widget: calendar mini, task summary, recent files, clock, weather
- Layout grid yang bisa di-rearrange user

---

## Phase 4: Fun & Nostalgia (Priority: Optional)

### 4.1 More XP Easter Eggs
- Minesweeper mini-game (buka dari Start Menu > Games)
- Clippy assistant yang muncul dengan tips
- "Blue Screen of Death" error page (untuk 500 errors)
- Windows XP Tour (interactive onboarding)

### 4.2 Theme System Expansion
- Luna Olive Green theme
- Royale theme (Media Center Edition)
- Zune theme (dark)
- Custom theme creator (pick your own colors)
- Per-window color scheme

### 4.3 Sound Scheme Manager
- Pilih sound scheme (default, no sounds, custom)
- Assign custom sounds ke events
- Volume slider di system tray
- Mute per-event

### 4.4 Start Menu Enhancements
- Recent documents list
- Pinned apps (drag to pin)
- "All Programs" submenu dengan flyout
- Run dialog (Ctrl+R) — quick navigate ke module/page

---

## Technical Debt & Infrastructure

### Database
- [ ] Tambah SQLite support kembali (detect driver otomatis)
- [ ] Database migration versioning (track schema version)
- [ ] Soft delete untuk projects, tasks, wiki (recycle bin functionality)

### Backend
- [ ] Input validation & sanitization yang lebih ketat
- [ ] Rate limiting untuk API
- [ ] CSRF protection
- [ ] Error logging ke file
- [ ] API response caching

### Frontend
- [ ] Lazy loading untuk icons dan wallpaper thumbnails
- [ ] Service Worker untuk offline support
- [ ] LocalStorage cache untuk API responses
- [ ] Accessibility improvements (keyboard navigation, ARIA labels)
- [ ] Mobile responsive mode (optional toggle)

### DevOps
- [ ] Docker setup (PHP + MySQL + Apache)
- [ ] Environment config (.env file support)
- [ ] Automated testing (PHPUnit untuk API)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] One-click deploy script

---

## Asset Inventory (Already Available)

| Asset | Count | Location |
|-------|-------|----------|
| XP Icons (PNG) | 500+ | `public/icons/` |
| Wallpapers | 21 | `public/images/wallpapers/` |
| Sound Effects | 30 | `public/sounds/` |
| Cursors (.cur/.ani) | 100+ | `public/cursors/` |
| Shell32 Animations | 11 | `public/shell32-animation/` |
| CSS Libraries | 4 | `public/css/` (xp.css, gui.css, vs.css, docs.css) |

Banyak asset yang belum terpakai maksimal — terutama cursors, shell32 animations, dan sebagian besar icons.
