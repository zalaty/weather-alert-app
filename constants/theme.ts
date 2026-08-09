export const Colors = {
  // Fondos
  backgroundLight: '#F0F4FF',
  backgroundDark: '#0D1117',

  // Acento principal
  accent: '#4A90E2',

  // Estados del tiempo
  rain: '#5B8DB8',
  sun: '#F5A623',
  storm: '#6B48A3',
  wind: '#7EC8C8',
  snow: '#C9E8F5',

  // Texto
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#FFFFFF',

  // UI
  cardLight: '#FFFFFF',
  cardDark: '#161B22',
  border: '#E5E7EB',
  borderDark: '#30363D',
};

export const LightTheme = {
  background: '#F0F4FF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#FFFFFF',
  accent: '#4A90E2',
  rain: '#5B8DB8',
  sun: '#F5A623',
  storm: '#6B48A3',
  wind: '#7EC8C8',
  aqiGood: '#2E9E5B',
  aqiModerate: '#B8860B',
  aqiUnhealthy: '#D64545',
};

export const DarkTheme = {
  background: '#0D1117',
  card: '#161B22',
  border: '#30363D',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textLight: '#FFFFFF',
  accent: '#4A90E2',
  rain: '#5B8DB8',
  sun: '#F5A623',
  storm: '#6B48A3',
  wind: '#7EC8C8',
  aqiGood: '#3FBE77',
  aqiModerate: '#D6A72A',
  aqiUnhealthy: '#E8635F',
};

export type Theme = typeof LightTheme;

export const Typography = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 72,

  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 999,
};
