<?php
class TranslatorController extends Controller
{
    public function translate(): void
    {
        $data = Request::body();
        $text = $data['text'] ?? '';
        $from = $data['from'] ?? 'auto';
        $to = $data['to'] ?? 'en';
        $provider = $data['provider'] ?? 'google';

        if (empty($text)) {
            Response::error('Text is required');
            return;
        }

        $apiKey = ApiKeyController::getKey('translator', $provider);
        if (!$apiKey) {
            Response::error("API key for '{$provider}' not configured. Go to Settings.");
            return;
        }

        $result = null;

        switch ($provider) {
            case 'google':
                $result = $this->translateGoogle($text, $from, $to, $apiKey);
                break;
            case 'deepl':
                $result = $this->translateDeepL($text, $from, $to, $apiKey);
                break;
            case 'microsoft':
                $result = $this->translateMicrosoft($text, $from, $to, $apiKey);
                break;
            case 'mymemory':
                $result = $this->translateMyMemory($text, $from, $to, $apiKey);
                break;
            default:
                Response::error('Unknown provider');
                return;
        }

        if ($result === null) {
            Response::error('Translation failed');
            return;
        }

        Response::success(['translated' => $result, 'provider' => $provider]);
    }

    private function translateGoogle(string $text, string $from, string $to, string $key): ?string
    {
        $url = 'https://translation.googleapis.com/language/translate/v2';
        $payload = ['q' => $text, 'target' => $to, 'key' => $key];
        if ($from !== 'auto') $payload['source'] = $from;
        $res = $this->curlPost($url . '?' . http_build_query($payload), null, false);
        return $res['data']['translations'][0]['translatedText'] ?? null;
    }

    private function translateDeepL(string $text, string $from, string $to, string $key): ?string
    {
        $url = str_contains($key, ':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
        $payload = ['text' => [$text], 'target_lang' => strtoupper($to)];
        if ($from !== 'auto') $payload['source_lang'] = strtoupper($from);
        $res = $this->curlPost($url, json_encode($payload), true, ['Authorization: DeepL-Auth-Key ' . $key, 'Content-Type: application/json']);
        return $res['translations'][0]['text'] ?? null;
    }

    private function translateMicrosoft(string $text, string $from, string $to, string $key): ?string
    {
        $region = 'southeastasia';
        $extra = ApiKeyController::getExtra('translator', 'microsoft');
        if ($extra && isset($extra['region'])) $region = $extra['region'];

        $url = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to={$to}";
        if ($from !== 'auto') $url .= "&from={$from}";
        $payload = json_encode([['Text' => $text]]);
        $headers = [
            'Ocp-Apim-Subscription-Key: ' . $key,
            'Ocp-Apim-Subscription-Region: ' . $region,
            'Content-Type: application/json',
        ];
        $res = $this->curlPost($url, $payload, true, $headers);
        return $res[0]['translations'][0]['text'] ?? null;
    }

    private function translateMyMemory(string $text, string $from, string $to, string $email): ?string
    {
        $langpair = ($from === 'auto' ? 'id' : $from) . '|' . $to;
        $url = 'https://api.mymemory.translated.net/get?' . http_build_query([
            'q' => $text, 'langpair' => $langpair, 'de' => $email,
        ]);
        $res = $this->curlGet($url);
        return $res['responseData']['translatedText'] ?? null;
    }

    private function curlGet(string $url): ?array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_SSL_VERIFYPEER => false]);
        $res = curl_exec($ch);
        curl_close($ch);
        return json_decode($res, true);
    }

    private function curlPost(string $url, ?string $body, bool $isJson = true, array $headers = []): ?array
    {
        $ch = curl_init($url);
        $opts = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_SSL_VERIFYPEER => false];
        if ($body) {
            $opts[CURLOPT_POST] = true;
            $opts[CURLOPT_POSTFIELDS] = $body;
        }
        if ($headers) $opts[CURLOPT_HTTPHEADER] = $headers;
        curl_setopt_array($ch, $opts);
        $res = curl_exec($ch);
        curl_close($ch);
        return json_decode($res, true);
    }
}
