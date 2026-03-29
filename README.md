# XP Workspace

**Project Management & Knowledge Base** — wrapped in a Windows XP desktop experience.

A full-featured productivity suite built with **PHP Native MVC** and **MySQL**, themed as an authentic Windows XP desktop with 500+ real XP icons, wallpapers, sounds, cursors, and pixel-perfect UI via xp.css.

---

## Quick Start

### Requirements
- PHP 8.0+ with `pdo_mysql` extension
- MySQL 5.7+ / MariaDB 10.3+
- Apache with `mod_rewrite` (or Nginx)
- No Composer, no npm — zero dependencies

### Run with Laragon / XAMPP

1. Clone ke folder web root:
   ```bash
   cd C:\laragon\www
   git clone https://github.com/s4rt4/xp-workspace.git
   ```
2. Buka `http://localhost/xp-workspace/`
3. Database `xp_workspace` otomatis dibuat beserta seed data

### Run with PHP Dev Server

```bash
cd xp-workspace
php -S localhost:8080
# Buka http://localhost:8080
```

### Database Config

Edit `config/database.php`:
```php
return [
    'driver'   => 'mysql',
    'host'     => '127.0.0.1',
    'port'     => 3306,
    'database' => 'xp_workspace',
    'username' => 'root',
    'password' => '',
    'charset'  => 'utf8mb4',
];
```

Database dan tabel dibuat otomatis pada request pertama.

---

## Architecture

```
xp-workspace/
├── index.php                   # Front controller
├── .htaccess                   # URL rewriting
├── config/
│   ├── app.php                 # App config & module registry
│   ├── database.php            # DB config (MySQL)
│   └── routes.php              # All route definitions
├── core/                       # MVC framework core
│   ├── Router.php              # URL router with {param} support
│   ├── Controller.php          # Base controller
│   ├── Model.php               # Base model (Active Record)
│   ├── Database.php            # PDO wrapper with auto-migration
│   ├── Request.php             # Input/validation helper
│   └── Response.php            # JSON/download responses
├── app/
│   ├── controllers/            # 7 controllers
│   ├── models/                 # 4 models
│   └── views/layouts/
│       └── desktop.php         # Main HTML shell
├── public/
│   ├── css/
│   │   ├── xp.css              # XP.css library (pixel-perfect XP components)
│   │   └── xp-theme.css        # Desktop environment overlay
│   ├── js/
│   │   └── desktop.js          # Window manager + all app modules
│   ├── icons/                  # 500+ authentic Windows XP icons (PNG)
│   ├── images/wallpapers/      # 21 XP wallpapers including Bliss
│   ├── sounds/                 # 30 original XP sound effects (WAV)
│   ├── cursors/                # 100+ XP cursors (.cur/.ani)
│   └── shell32-animation/      # 11 classic shell32 GIF animations
├── database/
│   └── schema.sql              # MySQL schema + seed data
└── storage/
    └── uploads/                # User-uploaded files
```

---

## Features

### Desktop Environment
- Boot screen with click-to-start (plays XP startup sound)
- Draggable, resizable, minimizable, maximizable windows
- Start Menu with module launcher
- Taskbar with active window buttons
- System tray with clock & sound toggle
- Right-click context menu
- Desktop icons (double-click to open)
- XP cursors throughout the UI
- Authentic notification balloons

### Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Stats overview, recent activity log |
| **Project Manager** | CRUD projects with colors, progress tracking |
| **Task Board** | Kanban board per project, drag-and-drop, priorities, due dates |
| **Knowledge Base** | Wiki pages with markdown, search, tree sidebar |
| **File Manager** | Upload, download, organize files |
| **Quick Notes** | Draggable sticky notes on the desktop |

### Theming
- **Luna Blue** — Classic XP default
- **Luna Silver** — Metallic gray
- **Classic** — Windows 2000 style
- **21 wallpapers** — Bliss, Azul, Autumn, and more
- Theme & wallpaper picker via right-click desktop or Start Menu

---

## API Reference

All endpoints return JSON: `{ "success": true, "message": "OK", "data": { ... } }`

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/{id}` | Get project with columns |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project + tasks |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?project_id=1` | List tasks (filterable) |
| GET | `/api/tasks/board/{projectId}` | Kanban board data |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| PUT | `/api/tasks/{id}/move` | Move task to column |
| DELETE | `/api/tasks/{id}` | Delete task |

### Wiki
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wiki` | List all pages |
| GET | `/api/wiki/tree` | Tree structure |
| GET | `/api/wiki/search?q=text` | Search pages |
| POST | `/api/wiki` | Create page |
| GET | `/api/wiki/{id}` | Get page + tags + children |
| PUT | `/api/wiki/{id}` | Update page |
| DELETE | `/api/wiki/{id}` | Delete page |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files` | List files |
| POST | `/api/files/upload` | Upload file (multipart) |
| GET | `/api/files/{id}/download` | Download file |
| DELETE | `/api/files/{id}` | Delete file |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List all notes |
| POST | `/api/notes` | Create note |
| PUT | `/api/notes/{id}` | Update note content/position |
| DELETE | `/api/notes/{id}` | Delete note |

---

## Adding a New Module

1. **Model** — Create `app/models/YourModel.php` extending `Model`
2. **Controller** — Create `app/controllers/YourController.php` extending `Controller`
3. **Routes** — Add endpoints in `config/routes.php`
4. **Frontend** — Add `Apps.YourApp` object in `desktop.js`
5. **Register** — Add to `config/app.php` modules array
6. **Icon** — Pick from 500+ icons in `public/icons/`

---

## Roadmap

### Phase 1 — Polish Core
- [ ] Task comments & checklists (tables exist, needs API + UI)
- [ ] File preview (images, text) & linking to tasks/wiki
- [ ] Better markdown rendering (marked.js or similar)
- [ ] Wiki tree view with expand/collapse
- [ ] Persist theme & wallpaper preference to database
- [ ] Draggable desktop icons with saved positions

### Phase 2 — New Modules
- [ ] Calendar — Event calendar, task deadline visualization
- [ ] Contacts — Address book linked to project assignees
- [ ] Pomodoro Timer — Focus timer linked to tasks
- [ ] Terminal — In-app command prompt for power users
- [ ] Notepad — Full text editor (open/save files)

### Phase 3 — Advanced
- [ ] Multi-user authentication (XP welcome screen style login)
- [ ] Global search from taskbar (search all modules)
- [ ] Gantt chart view for project timelines
- [ ] Real-time updates via WebSocket
- [ ] Import/export & backup (ZIP)
- [ ] Dashboard widgets (customizable layout)

### Phase 4 — Fun & Nostalgia
- [ ] Minesweeper mini-game
- [ ] Clippy assistant with tips
- [ ] Blue Screen of Death error page
- [ ] More themes: Luna Olive, Royale, Zune Dark
- [ ] Sound scheme manager
- [ ] Start Menu "All Programs" with flyout

See [next-development.md](next-development.md) for the full detailed plan.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8+ (native, no framework) |
| Database | MySQL / MariaDB |
| Frontend | Vanilla JavaScript, CSS |
| UI Library | xp.css (pixel-perfect XP components) |
| Architecture | MVC |
| Dependencies | Zero |

---

## Assets Included

| Asset | Count | Source |
|-------|-------|--------|
| XP Icons (PNG) | 500+ | Extracted shell32/imageres |
| Wallpapers | 21 | Original XP wallpapers |
| Sound Effects | 30 | Original XP WAV files |
| Cursors | 100+ | Original XP .cur/.ani files |
| Shell32 Animations | 11 | Classic file operation GIFs |

---

Built with nostalgia and productivity in mind.
