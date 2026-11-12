import i18n, { toApiLanguage } from '../i18n';

const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY ?? '';
const BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

export interface AirQuality {
  aqiUs: number;
  aqiEu: number;
  pm2_5: number;
  pm10: number;
  o3: number;
  no2: number;
}

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
  airQuality?: AirQuality;
}

export interface HourlyWeather {
  /** "HH:MM:SS" en hora local de la UBICACIÓN (no del dispositivo) */
  time: string;
  /** Instante absoluto del inicio de la hora (ms epoch). Opcional: los snapshots antiguos no lo traen */
  epoch?: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  uvIndex: number;
  precipProb: number;
  precipAmount: number;
  windSpeed: number;
  windDir: number;
  conditions: string;
  icon: string;
  airQuality?: AirQuality;
}

export interface DailyWeather {
  date: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  precipProb: number;
  precipAmount: number;
  windSpeed: number;
  windDir: number;
  conditions: string;
  icon: string;
  description: string;
  hours: HourlyWeather[];
  airQuality?: AirQuality;
}

export type WarningLevel = 'yellow' | 'orange' | 'red';

/** Aviso meteorológico oficial (AEMET/MeteoAlarm en Europa, NWS en EE. UU., etc.) vía Visual Crossing */
export interface OfficialWarning {
  id: string;
  event: string;
  headline: string;
  description: string;
  /** Hora local de la ubicación, ISO sin zona ("2026-11-03T20:59:59") */
  onset: string;
  ends: string;
  endsEpoch: number;
  link: string;
  level: WarningLevel;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  /** Opcional: los snapshots guardados por versiones anteriores no lo traen */
  warnings?: OfficialWarning[];
  location: string;
  timezone: string;
  lastUpdated: number;
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const lang = toApiLanguage(i18n.language);
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${lang}`,
      { headers: { 'User-Agent': 'WeatherAlertApp/1.0' } }
    );
    const data = await response.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality ||
      data.address?.county ||
      i18n.t('weather.defaultLocation')
    );
  } catch {
    return i18n.t('weather.defaultLocation');
  }
}

export interface CityResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string;
}

export async function searchCities(query: string): Promise<CityResult[]> {
  if (query.length < 2) return [];
  const lang = toApiLanguage(i18n.language);
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1&accept-language=${lang}&featuretype=city`,
      { headers: { 'User-Agent': 'WeatherAlertApp/1.0' } }
    );
    const data = await response.json();
    const seen = new Set<string>();
    const results: CityResult[] = [];
    for (const r of data as any[]) {
      const city: CityResult = {
        name: r.name,
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
        country: r.address?.country ?? '',
        region: r.address?.state ?? '',
      };
      const key = `${city.name}|${city.region}|${city.country}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(city);
      if (results.length === 5) break;
    }
    return results;
  } catch {
    return [];
  }
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  unitGroup: 'metric' | 'us' = 'metric'
): Promise<WeatherData> {
  const lang = toApiLanguage(i18n.language);
  const elements = [
    'datetime', 'datetimeEpoch', 'temp', 'feelslike', 'humidity', 'windspeed', 'winddir',
    'precipprob', 'precip', 'uvindex', 'visibility', 'conditions', 'icon',
    'sunrise', 'sunset', 'tempmax', 'tempmin', 'description',
    'aqius', 'aqieur', 'pm2p5', 'pm10', 'o3', 'no2',
  ].join(',');
  const url = `${BASE_URL}/${latitude},${longitude}?unitGroup=${unitGroup}&include=current,hours,days,alerts&elements=${elements}&key=${API_KEY}&contentType=json&lang=${lang}`;

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

function parseAirQuality(raw: any): AirQuality | undefined {
  if (raw.aqius == null) return undefined;
  return {
    aqiUs: Math.round(raw.aqius),
    aqiEu: Math.round(raw.aqieur ?? 0),
    pm2_5: raw.pm2p5 ?? 0,
    pm10: raw.pm10 ?? 0,
    o3: raw.o3 ?? 0,
    no2: raw.no2 ?? 0,
  };
}

// Visual Crossing no da un campo de severidad normalizado: el nivel va en el texto del aviso y en
// el idioma de la fuente. Se detectan rojo/naranja por palabra clave; todo lo demás es amarillo.
const RED_KEYWORDS = ['red', 'rojo', 'roja', 'vermelho', 'vermelha', 'rouge', 'rot', 'rote', 'roter', 'rosso', 'rossa', 'czerwon', 'kırmızı', 'extreme'];
const ORANGE_KEYWORDS = ['orange', 'naranja', 'laranja', 'arancione', 'pomarańcz', 'turuncu', 'severe'];

function detectWarningLevel(text: string): WarningLevel {
  const words = text.toLowerCase().split(/[^\p{L}]+/u);
  const has = (keywords: string[]) =>
    words.some((w) => keywords.some((k) => w === k || (k.length > 5 && w.startsWith(k))));
  if (has(RED_KEYWORDS)) return 'red';
  if (has(ORANGE_KEYWORDS)) return 'orange';
  return 'yellow';
}

const LEVEL_RANK: Record<WarningLevel, number> = { red: 0, orange: 1, yellow: 2 };

export function parseWarnings(rawAlerts: any[] | null | undefined, nowEpoch = Date.now() / 1000): OfficialWarning[] {
  if (!Array.isArray(rawAlerts)) return [];
  const seen = new Set<string>();
  return rawAlerts
    .filter((a) => a && a.event && (a.endsEpoch == null || a.endsEpoch > nowEpoch))
    .map((a): OfficialWarning => ({
      id: String(a.id ?? `${a.event}-${a.onsetEpoch}`),
      event: a.event,
      headline: a.headline ?? '',
      description: (a.description ?? '').trim(),
      onset: a.onset ?? '',
      ends: a.ends ?? '',
      endsEpoch: a.endsEpoch ?? 0,
      link: a.link ?? '',
      level: detectWarningLevel(`${a.event} ${a.headline ?? ''}`),
    }))
    // MeteoAlarm a veces repite el mismo aviso para zonas contiguas
    .filter((w) => {
      const key = `${w.event}|${w.ends}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || a.endsEpoch - b.endsEpoch);
}

function parseWeatherData(raw: any, cityName: string): WeatherData {
  const current = raw.currentConditions;
  const today = raw.days[0];

  const parseHour = (h: any): HourlyWeather => ({
    time: h.datetime,
    epoch: typeof h.datetimeEpoch === 'number' ? h.datetimeEpoch * 1000 : undefined,
    temp: Math.round(h.temp),
    feelsLike: Math.round(h.feelslike),
    humidity: Math.round(h.humidity ?? 0),
    uvIndex: h.uvindex ?? 0,
    precipProb: h.precipprob ?? 0,
    precipAmount: h.precip ?? 0,
    windSpeed: Math.round(h.windspeed),
    windDir: h.winddir ?? 0,
    conditions: h.conditions,
    icon: h.icon,
    airQuality: parseAirQuality(h),
  });

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
      airQuality: parseAirQuality(current),
    },

    hourly: (today.hours as any[]).map(parseHour),

    warnings: parseWarnings(raw.alerts),

    daily: (raw.days as any[]).map((d) => ({
      date: d.datetime,
      tempMax: Math.round(d.tempmax),
      tempMin: Math.round(d.tempmin),
      humidity: Math.round(d.humidity ?? 0),
      uvIndex: d.uvindex ?? 0,
      sunrise: d.sunrise ?? '',
      sunset: d.sunset ?? '',
      precipProb: d.precipprob ?? 0,
      precipAmount: d.precip ?? 0,
      windSpeed: Math.round(d.windspeed),
      windDir: d.winddir ?? 0,
      conditions: d.conditions,
      icon: d.icon,
      description: d.description ?? '',
      hours: ((d.hours ?? []) as any[]).map(parseHour),
      airQuality: parseAirQuality(d),
    })),
  };
}