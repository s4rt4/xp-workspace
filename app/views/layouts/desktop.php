<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XP Workspace — Project Management & Knowledge Base</title>
    <link rel="stylesheet" href="<?= BASE_URL ?>/public/css/xp.css">
    <link rel="stylesheet" href="<?= BASE_URL ?>/public/css/xp-theme.css">
</head>
<body class="theme-<?= htmlspecialchars($config['default_theme'] ?? 'luna-blue') ?>">

<!-- Pass config to JS -->
<script>
    const BASE_URL = '<?= BASE_URL ?>';
    const ICON_PATH = BASE_URL + '/public/icons';
    const SOUND_PATH = BASE_URL + '/public/sounds';
    const IMG_PATH = BASE_URL + '/public/images';
</script>

<!-- ═══ Boot Screen ═══ -->
<div id="boot-screen">
    <div class="boot-content">
        <div class="boot-logo">
            <img src="<?= BASE_URL ?>/public/icons/windows-xp.png" alt="XP" class="boot-logo-img" onerror="this.style.display='none'">
            <div class="boot-title">
                <span class="boot-xp">XP</span>
                <span class="boot-workspace">Workspace</span>
            </div>
        </div>
        <div class="boot-subtitle">Loading your desktop environment...</div>
        <div class="boot-progress">
            <div class="boot-progress-blocks">
                <span></span><span></span><span></span>
            </div>
        </div>
    </div>
    <div class="boot-footer">
        <span>Project Management & Knowledge Base</span>
    </div>
</div>

<!-- ═══ Desktop Area ═══ -->
<div id="desktop">
    <div class="desktop-icons">
        <?php
        $desktopIcons = [
            ['app' => 'dashboard',  'icon' => 'my-documents.png',        'label' => 'Dashboard'],
            ['app' => 'projects',   'icon' => 'briefcase.png',           'label' => 'Project Manager'],
            ['app' => 'tasks',      'icon' => 'checklist.png',           'label' => 'Task Board'],
            ['app' => 'wiki',       'icon' => 'help-and-support.png',    'label' => 'Knowledge Base'],
            ['app' => 'files',      'icon' => 'my-computer.png',         'label' => 'File Manager'],
            ['app' => 'notes',      'icon' => 'notepad.png',             'label' => 'Quick Notes'],
        ];
        foreach ($desktopIcons as $di):
        ?>
        <div class="desktop-icon" data-app="<?= $di['app'] ?>">
            <img src="<?= BASE_URL ?>/public/icons/<?= $di['icon'] ?>" onerror="this.src='<?= BASE_URL ?>/public/icons/default.png'" alt="<?= $di['label'] ?>">
            <span><?= $di['label'] ?></span>
        </div>
        <?php endforeach; ?>
        <div class="desktop-icon" data-app="recycle">
            <img src="<?= BASE_URL ?>/public/icons/recycle-bin-(empty).png" alt="Recycle Bin">
            <span>Recycle Bin</span>
        </div>
    </div>
</div>

<!-- ═══ Taskbar ═══ -->
<div id="taskbar">
    <button id="start-button">
        <img src="<?= BASE_URL ?>/public/icons/windows-xp.png" alt="" onerror="this.style.display='none'">
        <span>start</span>
    </button>

    <div class="taskbar-divider"></div>

    <div class="quick-launch">
        <button class="quick-launch-btn" onclick="XP.openApp('dashboard')" title="Dashboard">
            <img src="<?= BASE_URL ?>/public/icons/my-documents.png" alt="">
        </button>
        <button class="quick-launch-btn" onclick="XP.openApp('wiki')" title="Knowledge Base">
            <img src="<?= BASE_URL ?>/public/icons/help-and-support.png" alt="">
        </button>
        <button class="quick-launch-btn" onclick="Apps.Notes.open()" title="New Note">
            <img src="<?= BASE_URL ?>/public/icons/notepad.png" alt="">
        </button>
    </div>

    <div class="taskbar-divider"></div>

    <div class="taskbar-buttons" id="taskbar-buttons"></div>

    <div class="system-tray">
        <img class="tray-icon" src="<?= BASE_URL ?>/public/icons/audio-devices.png" alt="Sound" title="Sound" onclick="XP.toggleSound()">
        <span id="tray-clock">--:--</span>
    </div>
</div>

<!-- ═══ Start Menu ═══ -->
<div id="start-menu">
    <div class="start-menu-header">
        <div class="avatar">
            <img src="<?= BASE_URL ?>/public/icons/user-accounts.png" alt="" onerror="this.parentElement.textContent='👤'">
        </div>
        <span class="username"><?= htmlspecialchars($config['name'] ?? 'XP Workspace') ?></span>
    </div>
    <div class="start-menu-body">
        <div class="start-menu-left">
            <!-- Populated by JS from config modules -->
        </div>
        <div class="start-menu-right">
            <div class="start-menu-item" onclick="XP.openApp('dashboard')">
                <img src="<?= BASE_URL ?>/public/icons/my-documents.png" alt="">
                <span>Dashboard</span>
            </div>
            <div class="start-menu-item" onclick="XP.openApp('wiki')">
                <img src="<?= BASE_URL ?>/public/icons/help-and-support.png" alt="">
                <span>Knowledge Base</span>
            </div>
            <div class="start-menu-item" onclick="XP.openApp('files')">
                <img src="<?= BASE_URL ?>/public/icons/my-computer.png" alt="">
                <span>File Manager</span>
            </div>
            <div class="start-menu-separator"></div>
            <div class="start-menu-item" onclick="XP.openApp('projects')">
                <img src="<?= BASE_URL ?>/public/icons/briefcase.png" alt="">
                <span>Projects</span>
            </div>
            <div class="start-menu-item" onclick="XP.openApp('tasks')">
                <img src="<?= BASE_URL ?>/public/icons/checklist.png" alt="">
                <span>Task Board</span>
            </div>
            <div class="start-menu-separator"></div>
            <div class="start-menu-item" onclick="XP.showAbout()">
                <img src="<?= BASE_URL ?>/public/icons/information.png" alt="">
                <span>About</span>
            </div>
        </div>
    </div>
    <div class="start-menu-footer">
        <button onclick="XP.showThemePicker()">
            <img src="<?= BASE_URL ?>/public/icons/appearance.png" alt="" style="width:16px;height:16px">
            Themes
        </button>
        <button onclick="XP.notify('Log Off', 'This is a single-user workspace')">
            <img src="<?= BASE_URL ?>/public/icons/logout.png" alt="" style="width:16px;height:16px" onerror="this.style.display='none'">
            Log Off
        </button>
    </div>
</div>

<!-- ═══ Context Menu ═══ -->
<div id="context-menu" class="context-menu"></div>

<!-- ═══ Scripts ═══ -->
<script src="<?= BASE_URL ?>/public/js/desktop.js"></script>

</body>
</html>
