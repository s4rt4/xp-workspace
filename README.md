# 🖥️ XP Workspace

**Project Management & Knowledge Base** — wrapped in a Windows XP desktop experience.

A full-featured productivity suite built with **PHP Native MVC** and **SQLite**, themed as a Windows XP desktop environment with multi-window management, Start Menu, taskbar, system tray, and drag-and-drop.

---

## 🚀 Quick Start

### Requirements
- PHP 8.0+ with PDO SQLite extension
- Apache with `mod_rewrite` (or Nginx equivalent)
- No Composer, no npm — zero dependencies

### Run Locally

```bash
# Clone / extract project
cd xp-workspace

# Start PHP dev server
php -S localhost:8080

# Open browser
# → http://localhost:8080
```

The SQLite database is auto-created on first run with seed data.

### Apache Setup

Point your DocumentRoot to the project root and ensure `.htaccess` is active:

```apache
<VirtualHost *:80>
    DocumentRoot /path/to/xp-workspace
    <Directory /path/to/xp-workspace>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

---

## 🏗️ Architecture

```
xp-workspace/
├── index.php                   # Front controller
├── .htaccess                   # URL rewriting
├── config/
│   ├── app.php                 # App config & module registry
│   ├── database.php            # DB config (SQLite/MySQL)
│   └── routes.php              # All route definitions
├── core/                       # MVC framework core
│   ├── Router.php              # URL router with {param} support
│   ├── Controller.php          # Base controller
│   ├── Model.php               # Base model (Active Record)
│   ├── Database.php            # PDO wrapper (SQLite + MySQL)
│   ├── Request.php             # Input/validation helper
│   └── Response.php            # JSON/download responses
├── app/
│   ├── controllers/            # App controllers
│   │   ├── DesktopController   # Main shell
│   │   ├── DashboardController # Stats & overview
│   │   ├── ProjectController   # CRUD projects
│   │   ├── TaskController      # Kanban board & tasks
│   │   ├── WikiController      # Knowledge base
│   │   ├── FileController      # File uploads
│   │   └── NoteController      # Sticky notes
│   ├── models/
│   │   ├── Project.php
│   │   ├── Task.php
│   │   ├── WikiPage.php
│   │   └── Note.php
│   └── views/
│       └── layouts/
│           └── desktop.php     # Main HTML shell
├── public/
│   ├── css/
│   │   └── xp-theme.css       # Full XP Luna theme
│   ├── js/
│   │   └── desktop.js          # Window manager + all apps
│   ├── images/icons/           # Desktop & app icons
│   ├── sounds/                 # XP sounds (add your own!)
│   └── cursors/                # XP cursors (add your own!)
├── database/
│   └── schema.sql              # Full schema + seed data
└── storage/
    └── uploads/                # Uploaded files
```

---

## 📦 Modules

### ✅ Active (Phase 1)

| Module | Description |
|--------|-------------|
| **Dashboard** | Stats overview, recent activity, upcoming tasks |
| **Project Manager** | Create/manage projects with colors, progress tracking |
| **Task Board** | Kanban board per project with drag-and-drop, priorities, due dates |
| **Knowledge Base** | Wiki with tree structure, markdown content, search, tags |
| **File Manager** | Upload, download, organize files in folders |
| **Quick Notes** | Draggable sticky notes on the desktop |

### 🔜 Planned (Future Phases)

| Module | Ideas |
|--------|-------|
| **Calendar** | Event calendar, task deadlines visualization |
| **Contacts** | Address book linked to projects |
| **Time Tracker** | Pomodoro timer, time logging per task |
| **Gantt Chart** | Visual timeline across projects |
| **Settings** | Theme picker, sound toggle, user profile |
| **Terminal** | In-app command line for power users |
| **Chat/Comments** | Real-time discussion per project |

---

## 🎨 XP Theming

### Built-in Themes
- **Luna Blue** (default) — Classic XP blue
- **Luna Silver** — Metallic gray
- **Classic** — Windows 2000 / Classic style

### Adding Your Own Assets

#### Sounds
Place `.wav` files in `public/sounds/`:
```
startup.wav, click.wav, error.wav, notify.wav,
close.wav, minimize.wav, maximize.wav, recycle.wav
```

#### Cursors
Place cursor files in `public/cursors/` and reference in CSS:
```css
body { cursor: url('/public/cursors/arrow.cur'), default; }
```

#### Icons
Replace SVG placeholders in `public/images/icons/` with your shell32 icon extracts.

#### Wallpaper
Add a wallpaper image and reference in CSS:
```css
#desktop { background-image: url('/public/images/bliss.jpg'); }
```

---

## 🔧 API Reference

All data endpoints return JSON. Format:

```json
{ "success": true, "message": "OK", "data": { ... } }
```

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

## 🛠️ Development Notes

### Adding a New Module

1. **Model**: Create `app/models/YourModel.php` extending `Model`
2. **Controller**: Create `app/controllers/YourController.php` extending `Controller`
3. **Routes**: Add endpoints in `config/routes.php`
4. **Frontend**: Add app object in `Apps.YourApp` in `desktop.js`
5. **Register**: Add to `config/app.php` modules array
6. **Icon**: Add icon to `public/images/icons/`

### Switching to MySQL

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

Then import `database/schema.sql` (may need minor syntax adjustments for MySQL).

---

## 📐 Tech Stack

- **Backend**: PHP 8+ (native, no framework)
- **Database**: SQLite (default) / MySQL
- **Frontend**: Vanilla JS, CSS
- **Architecture**: MVC
- **Dependencies**: Zero. None. Nada.

---

**Built with nostalgia and productivity in mind.** 🖥️✨
