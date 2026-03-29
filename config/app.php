<?php

return [
    'name'     => 'XP Workspace',
    'version'  => '1.0.0',
    'debug'    => true,
    'timezone' => 'Asia/Jakarta',
    'base_url' => '/', // Change if in subdirectory, e.g. '/xp-workspace/'

    // Default theme: 'luna-blue', 'luna-silver', 'luna-olive', 'classic'
    'default_theme' => 'luna-blue',

    // Default wallpaper
    'wallpaper' => 'bliss.png',

    // Enable XP sounds
    'sounds_enabled' => true,

    // Modules (order = Start Menu order)
    'modules' => [
        'dashboard'  => ['name' => 'Dashboard',        'icon' => 'my-documents.png',      'enabled' => true],
        'projects'   => ['name' => 'Project Manager',  'icon' => 'briefcase.png',          'enabled' => true],
        'tasks'      => ['name' => 'Task Board',       'icon' => 'checklist.png',          'enabled' => true],
        'wiki'       => ['name' => 'Knowledge Base',   'icon' => 'help-and-support.png',   'enabled' => true],
        'files'      => ['name' => 'File Manager',     'icon' => 'my-computer.png',        'enabled' => true],
        'notes'      => ['name' => 'Quick Notes',      'icon' => 'notepad.png',            'enabled' => true],
        'calendar'   => ['name' => 'Calendar',         'icon' => 'date-and-time.png',      'enabled' => false],
        'contacts'   => ['name' => 'Contacts',         'icon' => 'address-book.png',       'enabled' => false],
    ],
];
