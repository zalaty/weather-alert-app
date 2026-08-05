const ICON_MAP: Record<string, string> = {
  'clear-day': '☀️',
  'clear-night': '🌙',
  'partly-cloudy-day': '⛅',
  'partly-cloudy-night': '🌙',
  cloudy: '☁️',
  rain: '🌧️',
  'showers-day': '🌦️',
  'showers-night': '🌧️',
  thunder: '⛈️',
  'thunder-showers-day': '⛈️',
  'thunder-showers-night': '⛈️',
  snow: '❄️',
  'snow-showers-day': '🌨️',
  'snow-showers-night': '🌨️',
  fog: '🌫️',
  wind: '💨',
  hail: '🌨️',
};

export function getWeatherEmoji(icon: string): string {
  return ICON_MAP[icon] ?? '🌤️';
}
