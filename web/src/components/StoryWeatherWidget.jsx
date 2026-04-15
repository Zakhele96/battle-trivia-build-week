import { useEffect, useState } from "react";

const SEARCH_NAME = "Durban";
const COUNTRY_CODE = "ZA";

function weatherLabelFromCode(code) {
  const map = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Heavy showers",
    82: "Violent showers",
    95: "Thunderstorm",
    96: "Storm with hail",
    99: "Heavy hailstorm",
  };

  return map[code] || "Weather";
}

function weatherEmojiFromCode(code) {
  if (code === 0) return "☀️";
  if ([1, 2].includes(code)) return "⛅";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55].includes(code)) return "🌦️";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

export default function StoryWeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWeather();
  }, []);

  async function loadWeather() {
    try {
      setLoading(true);
      setError("");

      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          SEARCH_NAME
        )}&count=1&countryCode=${COUNTRY_CODE}`
      );
      const geoData = await geoResponse.json();

      const place = geoData?.results?.[0];

      if (!place) {
        throw new Error("Location not found.");
      }

      const forecastResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&timezone=Africa%2FJohannesburg&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min`
      );
      const forecastData = await forecastResponse.json();

      setWeather({
        placeName: `${place.name}, ${place.country_code}`,
        current: forecastData.current,
        daily: {
          max: forecastData?.daily?.temperature_2m_max?.[0],
          min: forecastData?.daily?.temperature_2m_min?.[0],
          weatherCode: forecastData?.daily?.weather_code?.[0],
        },
      });
    } catch (err) {
      setError(err?.message || "Failed to load weather.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-slate-200 bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Today’s Weather
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-slate-600">Loading weather...</div>
      ) : error ? (
        <div className="mt-4 text-sm text-red-700">{error}</div>
      ) : weather ? (
        <>
          <div className="mt-4 text-sm text-slate-600">{weather.placeName}</div>

          <div className="mt-4 flex items-center gap-3">
            <div className="text-3xl">
              {weatherEmojiFromCode(weather.current.weather_code)}
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-900">
                {Math.round(weather.current.temperature_2m)}°C
              </div>
              <div className="text-sm text-slate-600">
                {weatherLabelFromCode(weather.current.weather_code)}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
            <div>
              <div className="font-semibold text-slate-900">High / Low</div>
              <div>
                {Math.round(weather.daily.max)}° / {Math.round(weather.daily.min)}°
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-900">Feels like</div>
              <div>{Math.round(weather.current.apparent_temperature)}°C</div>
            </div>

            <div>
              <div className="font-semibold text-slate-900">Humidity</div>
              <div>{weather.current.relative_humidity_2m}%</div>
            </div>

            <div>
              <div className="font-semibold text-slate-900">Wind</div>
              <div>{Math.round(weather.current.wind_speed_10m)} km/h</div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}