// Degradado de la tarjeta principal de Home según el icono de Visual Crossing.
// Todos los tonos están elegidos para que el texto blanco encima mantenga buen contraste.

type Gradient = readonly [string, string];

const GRADIENTS = {
  clearDay: ['#2A74D6', '#4A90E2'],
  cloudyDay: ['#3F6EA8', '#6489B8'],
  overcast: ['#4E5F73', '#738599'],
  rain: ['#34507A', '#5B7FA8'],
  storm: ['#2E2350', '#5E4596'],
  snow: ['#4A7399', '#6A90B5'],
  fog: ['#56616E', '#7D8894'],
  night: ['#121B36', '#2C4373'],
} satisfies Record<string, Gradient>;

const ICON_GRADIENTS: Record<string, Gradient> = {
  'clear-day': GRADIENTS.clearDay,
  'partly-cloudy-day': GRADIENTS.cloudyDay,
  'clear-night': GRADIENTS.night,
  'partly-cloudy-night': GRADIENTS.night,
  cloudy: GRADIENTS.overcast,
  wind: GRADIENTS.overcast,
  fog: GRADIENTS.fog,
  rain: GRADIENTS.rain,
  'showers-day': GRADIENTS.rain,
  'showers-night': GRADIENTS.rain,
  thunder: GRADIENTS.storm,
  'thunder-rain': GRADIENTS.storm,
  'thunder-showers-day': GRADIENTS.storm,
  'thunder-showers-night': GRADIENTS.storm,
  snow: GRADIENTS.snow,
  'snow-showers-day': GRADIENTS.snow,
  'snow-showers-night': GRADIENTS.snow,
  hail: GRADIENTS.snow,
};

export function getWeatherGradient(icon: string): Gradient {
  return ICON_GRADIENTS[icon] ?? GRADIENTS.clearDay;
}
