export type AqiCategory =
  | 'good'
  | 'moderate'
  | 'unhealthySensitive'
  | 'unhealthy'
  | 'veryUnhealthy'
  | 'hazardous';

export type AqiSeverity = 'good' | 'moderate' | 'unhealthy';

export function getAqiCategory(aqiUs: number): AqiCategory {
  if (aqiUs <= 50) return 'good';
  if (aqiUs <= 100) return 'moderate';
  if (aqiUs <= 150) return 'unhealthySensitive';
  if (aqiUs <= 200) return 'unhealthy';
  if (aqiUs <= 300) return 'veryUnhealthy';
  return 'hazardous';
}

export function getAqiSeverity(category: AqiCategory): AqiSeverity {
  if (category === 'good') return 'good';
  if (category === 'moderate' || category === 'unhealthySensitive') return 'moderate';
  return 'unhealthy';
}

const POLLUTANT_BAR_MAX: Record<'pm2_5' | 'pm10' | 'o3' | 'no2', number> = {
  pm2_5: 150,
  pm10: 200,
  o3: 200,
  no2: 200,
};

export function getPollutantBarRatio(pollutant: keyof typeof POLLUTANT_BAR_MAX, value: number): number {
  return Math.min(1, Math.max(0, value / POLLUTANT_BAR_MAX[pollutant]));
}
