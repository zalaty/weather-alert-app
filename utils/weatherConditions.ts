import { TFunction } from 'i18next';

const CONDITION_KEYS: Record<string, string> = {
  'Clear': 'clear', 'Partially cloudy': 'partiallyCloudy',
  'Overcast': 'overcast', 'Rain': 'rain',
  'Rain, Partially cloudy': 'rainPartiallyCloudy', 'Rain, Overcast': 'rainOvercast',
  'Light Rain': 'lightRain', 'Heavy Rain': 'heavyRain',
  'Drizzle': 'drizzle', 'Snow': 'snow', 'Fog': 'fog',
  'Wind': 'wind', 'Cloudy': 'cloudy', 'Thunder': 'thunder',
  'Thunder, Rain': 'thunderRain', 'Hail': 'hail',
  'Ice': 'ice', 'Tornado': 'tornado',
};

export function translateCondition(condition: string, t: TFunction): string {
  const key = CONDITION_KEYS[condition];
  return key ? t(`weather.conditions.${key}`) : condition;
}

function normalizeForCompare(text: string): string {
  return text.trim().replace(/[.\s]+$/u, '').toLocaleLowerCase();
}

/** La descripción del día no aporta nada si repite el estado ("Clear." vs "Clear"). */
export function isRedundantDescription(description: string, conditions: string): boolean {
  return normalizeForCompare(description) === normalizeForCompare(conditions);
}
