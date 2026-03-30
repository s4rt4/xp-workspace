<?php
class WeatherController extends Controller
{
    public function search(): void
    {
        $city = $_GET['city'] ?? '';
        if (empty($city)) {
            Response::error('City is required');
            return;
        }

        $apiKey = ApiKeyController::getKey('weather', 'openweathermap');
        if (!$apiKey) {
            Response::error('OpenWeatherMap API key not configured. Go to Settings.');
            return;
        }

        $city = urlencode($city);
        $url = "https://api.openweathermap.org/data/2.5/weather?q={$city}&appid={$apiKey}&units=metric&lang=id";

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            $data = json_decode($response, true);
            Response::error($data['message'] ?? 'City not found');
            return;
        }

        Response::success(json_decode($response, true));
    }
}
