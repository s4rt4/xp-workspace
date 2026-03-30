<?php
class CurrencyController extends Controller
{
    public function convert(): void
    {
        $data = Request::body();
        $from = strtoupper($data['from'] ?? '');
        $to = strtoupper($data['to'] ?? '');
        $amount = floatval($data['amount'] ?? 0);
        $provider = $data['provider'] ?? 'exchangerate-api';

        if (empty($from) || empty($to) || $amount <= 0) {
            Response::error('From, to, and amount are required');
            return;
        }

        $apiKey = ApiKeyController::getKey('currency', $provider);
        if (!$apiKey) {
            Response::error("API key for '{$provider}' not configured. Go to Settings.");
            return;
        }

        $result = null;
        $rate = null;

        switch ($provider) {
            case 'exchangerate-api':
                $url = "https://v6.exchangerate-api.com/v6/{$apiKey}/pair/{$from}/{$to}/{$amount}";
                $res = $this->curlGet($url);
                if ($res && $res['result'] === 'success') {
                    $rate = $res['conversion_rate'];
                    $result = $res['conversion_result'];
                }
                break;

            case 'currencyapi':
                $url = "https://api.currencyapi.com/v3/latest?apikey={$apiKey}&currencies={$to}&base_currency={$from}";
                $res = $this->curlGet($url);
                if ($res && isset($res['data'][$to])) {
                    $rate = $res['data'][$to]['value'];
                    $result = $amount * $rate;
                }
                break;

            case 'fixer':
                $url = "http://data.fixer.io/api/latest?access_key={$apiKey}&symbols={$from},{$to}";
                $res = $this->curlGet($url);
                if ($res && $res['success'] && isset($res['rates'][$from], $res['rates'][$to])) {
                    $rate = $res['rates'][$to] / $res['rates'][$from];
                    $result = $amount * $rate;
                }
                break;

            case 'fxratesapi':
                $url = "https://api.fxratesapi.com/latest?api_key={$apiKey}&base={$from}&currencies={$to}";
                $res = $this->curlGet($url);
                if ($res && isset($res['rates'][$to])) {
                    $rate = $res['rates'][$to];
                    $result = $amount * $rate;
                }
                break;

            default:
                Response::error('Unknown provider');
                return;
        }

        if ($result === null) {
            Response::error('Conversion failed. Check API key or try another provider.');
            return;
        }

        Response::success([
            'from' => $from,
            'to' => $to,
            'amount' => $amount,
            'rate' => $rate,
            'result' => $result,
            'provider' => $provider,
        ]);
    }

    private function curlGet(string $url): ?array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }
}
