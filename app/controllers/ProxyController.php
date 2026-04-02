<?php
class ProxyController extends Controller
{
    /**
     * Proxy for equran.id API to avoid mixed content issues
     */
    public function quran(): void
    {
        $path = $_GET['path'] ?? '';
        if (empty($path)) {
            Response::error('Path required');
            return;
        }

        // Whitelist allowed paths
        $allowed = ['v2/surat', 'v2/tafsir', 'doa', 'v2/shalat'];
        $ok = false;
        foreach ($allowed as $prefix) {
            if (str_starts_with($path, $prefix)) { $ok = true; break; }
        }
        if (!$ok) {
            Response::error('Invalid path');
            return;
        }

        // Collect extra params (everything except path/url)
        $extra = $_GET;
        unset($extra['path'], $extra['url']);

        // Also merge POST body if present
        $postBody = file_get_contents('php://input');
        $postData = json_decode($postBody, true) ?: [];
        $extra = array_merge($extra, $postData);

        $url = 'https://equran.id/api/' . $path;
        $ch = curl_init($url);
        $curlOpts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => false,
        ];

        // If extra params exist, send as POST JSON (some equran.id endpoints require POST)
        if (!empty($extra)) {
            $curlOpts[CURLOPT_POST] = true;
            $curlOpts[CURLOPT_POSTFIELDS] = json_encode($extra);
            $curlOpts[CURLOPT_HTTPHEADER] = ['Content-Type: application/json'];
        }
        curl_setopt_array($ch, $curlOpts);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        header('Content-Type: application/json');
        http_response_code($httpCode);
        echo $response;
        exit;
    }

    /**
     * Proxy for DiceBear avatar API to avoid mixed content issues
     */
    public function avatar(): void
    {
        $style = $_GET['style'] ?? 'adventurer';
        $seed = $_GET['seed'] ?? 'default';

        // Whitelist styles
        $allowed = ['adventurer','adventurer-neutral','avataaars','big-ears','big-smile','bottts','croodles','fun-emoji','icons','identicon','initials','lorelei','micah','miniavs','notionists','open-peeps','personas','pixel-art','thumbs'];
        if (!in_array($style, $allowed)) {
            $style = 'adventurer';
        }

        $seed = preg_replace('/[^a-zA-Z0-9._-]/', '', $seed);
        $url = "https://api.dicebear.com/8.x/{$style}/svg?seed=" . urlencode($seed);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $svg = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $svg) {
            header('Content-Type: image/svg+xml');
            header('Cache-Control: public, max-age=86400');
            echo $svg;
        } else {
            http_response_code(502);
            echo '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="72" height="72" fill="#eee"/><text x="36" y="40" text-anchor="middle" font-size="10" fill="#999">Error</text></svg>';
        }
        exit;
    }
}
