const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY ?? '';
const BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDir: number;
  precipProb: number;
  precipAmount: number;
  uvIndex: number;
  visibility: number;
  conditions: string;
  icon: string;
  description: string;
  sunrise: string;
  sunset: string;
}

export interface HourlyWeather {
  time: string;
  temp: number;
  feelsLike: number;
  precipProb: number;
  precipAmount: number;
  windSpeed: number;
  windDir: number;
  conditions: string;
  icon: string;
}

export interface DailyWeather {
  date: string;
  tempMax: number;
  tempMin: number;
  precipProb: number;
  precipAmount: number;
  windSpeed: number;
  windDir: number;
  conditions: string;
  icon: string;
  description: string;
  hours: HourlyWeather[];
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  location: string;
  timezone: string;
  lastUpdated: number;
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`,
      { headers: { 'User-Agent': 'WeatherAlertApp/1.0' } }
    );
    const data = await response.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality ||
      data.address?.county ||
      'Tu ubicación'
    );
  } catch {
    return 'Tu ubicación';
  }
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  unitGroup: 'metric' | 'us' = 'metric'
): Promise<WeatherData> {
  const url = `${BASE_URL}/${latitude},${longitude}?unitGroup=${unitGroup}&include=current,hours,days&key=${API_KEY}&contentType=json`;

  const [weatherResponse, cityName] = await Promise.all([
    fetch(url),
    reverseGeocode(latitude, longitude),
  ]);

  if (!weatherResponse.ok) {
    throw new Error(`Weather API error: ${weatherResponse.status}`);
  }

  const data = await weatherResponse.json();
  return parseWeatherData(data, cityName);
}

function parseWeatherData(raw: any, cityName: string): WeatherData {
  const current = raw.currentConditions;
  const today = raw.days[0];

  return {
    location: cityName,
    timezone: raw.timezone,
    lastUpdated: Date.now(),

    current: {
      temp: Math.round(current.temp),
      feelsLike: Math.round(current.feelslike),
      humidity: current.humidity,
      windSpeed: Math.round(current.windspeed),
      windDir: current.winddir,
      precipProb: current.precipprob ?? 0,
      precipAmount: current.precip ?? 0,
      uvIndex: current.uvindex,
      visibility: current.visibility,
      conditions: current.conditions,
      icon: current.icon,
      description: today.description ?? '',
      sunrise: current.sunrise,
      sunset: current.sunset,
    },

    hourly: (today.hours as any[]).map((h) => ({
      time: h.datetime,
      temp: Math.round(h.temp),
      feelsLike: Math.round(h.feelslike),
      precipProb: h.precipprob ?? 0,
      precipAmount: h.precip ?? 0,
      windSpeed: Math.round(h.windspeed),
      windDir: h.winddir ?? 0,
      conditions: h.conditions,
      icon: h.icon,
    })),

    daily: (raw.days as any[]).map((d) => ({
      date: d.datetime,
      tempMax: Math.round(d.tempmax),
      tempMin: Math.round(d.tempmin),
      precipProb: d.precipprob ?? 0,
      precipAmount: d.precip ?? 0,
      windSpeed: Math.round(d.windspeed),
      windDir: d.winddir ?? 0,
      conditions: d.conditions,
      icon: d.icon,
      description: d.description ?? '',
      hours: ((d.hours ?? []) as any[]).map((h) => ({
        time: h.datetime,
        temp: Math.round(h.temp),
        feelsLike: Math.round(h.feelslike),
        precipProb: h.precipprob ?? 0,
        precipAmount: h.precip ?? 0,
        windSpeed: Math.round(h.windspeed),
        windDir: h.winddir ?? 0,
        conditions: h.conditions,
        icon: h.icon,
      })),
    })),
  };
}