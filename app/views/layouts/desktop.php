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
            ['app' => 'notes',      'icon' => 'stickynotes.png',         'label' => 'Quick Notes'],
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
            <img src="<?= BASE_URL ?>/public/icons/stickynotes.png" alt="">
        </button>
    </div>

    <div class="taskbar-divider"></div>

    <div class="taskbar-buttons" id="taskbar-buttons"></div>

    <div class="system-tray">
        <div class="tray-expand" id="tray-expand" onclick="XP.SystemTray.toggleExpand()" title="Show hidden icons">&#9650;</div>
        <div class="tray-icons" id="tray-icons"></div>
        <div class="tray-divider"></div>
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
            <!-- Populated by StartMenu.js -->
        </div>
        <div class="start-menu-right">
            <!-- Populated by StartMenu.js (categories) -->
        </div>
    </div>
    <div class="start-menu-footer">
        <div class="sm-search-wrap">
            <img src="<?= BASE_URL ?>/public/icons/search.png" alt="" style="width:14px;height:14px">
            <input class="sm-search-input" id="sm-search" placeholder="Search apps..." type="text">
        </div>
        <div style="display:flex;gap:2px">
            <button onclick="location.reload()" title="Refresh" style="flex:1">
                <img src="<?= BASE_URL ?>/public/icons/restart.png" alt="" style="width:16px;height:16px" onerror="this.style.display='none'">
                Refresh
            </button>
            <button onclick="location.reload(true)" title="Hard Refresh (bypass cache)">
                <img src="<?= BASE_URL ?>/public/icons/forward.png" alt="" style="width:16px;height:16px" onerror="this.style.display='none'">
            </button>
            <button onclick="XP.clearCacheAndReload()" title="Clear Cache & Reload">
                <img src="<?= BASE_URL ?>/public/icons/erase.png" alt="" style="width:16px;height:16px" onerror="this.style.display='none'">
            </button>
        </div>
    </div>
</div>

<!-- ═══ Context Menu ═══ -->
<div id="context-menu" class="context-menu"></div>

<!-- ═══ Scripts ═══ -->
<script src="<?= BASE_URL ?>/public/js/desktop.js"></script>
<script src="<?= BASE_URL ?>/public/js/startmenu.js"></script>
<script src="<?= BASE_URL ?>/public/js/widgets.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/notepad.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/codeplayground.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/vscoder.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/filegenerator.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/csvviewer.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/pdfflipbook.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/dummygenerator.js"></script>
<script src="<?= BASE_URL ?>/public/js/apikeys.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/weather.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/currency.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/translator.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/imagetools.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/imageeditor.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/colorpicker.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/jsonformatter.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/pomodoro.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/paint.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/svgeditor.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/pixelart.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/wireframe.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/systeminfo.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/startupmanager.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/storagemanager.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/activitylog.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/backuprestore.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/hijricalendar.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/dzikircounter.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/qiblacompass.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/kanban.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/habittracker.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/bookmarks.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/spreadsheet.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/wordprocessor.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/apitester.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/stopwatch.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/flappybird.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/chess.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/typingtest.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/regextester.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/base64tool.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/diffviewer.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/timestamp.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/musicplayer.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/videoplayer.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/calculator.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/todolist.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/piano.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/tetris.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/minesweeper.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/snake.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/game2048.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/tictactoe.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/memorycard.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/solitaire.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/breakout.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/sudoku.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/wordle.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/pong.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/hashgenerator.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/tvplayer.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/radio.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/invoice.js"></script>
<script src="<?= BASE_URL ?>/public/js/apps/quran.js"></script>

</body>
</html>
