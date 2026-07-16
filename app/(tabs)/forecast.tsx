import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeather } from '../../hooks/useWeather';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing, Radius, Theme } from '../../constants/theme';
import { DailyWeather } from '../../services/weatherApi';
import { getIntlLocale } from '../../i18n';

function getWeatherEmoji(icon: string): string {
  const map: Record<string, string> = {
    'clear-day': '☀️', 'clear-night': '🌙', 'partly-cloudy-day': '⛅',
    'partly-cloudy-night': '🌙', cloudy: '☁️', rain: '🌧️',
    'showers-day': '🌦️', 'showers-night': '🌧️', thunder: '⛈️',
    'thunder-showers-day': '⛈️', 'thunder-showers-night': '⛈️',
    snow: '❄️', 'snow-showers-day': '🌨️', 'snow-showers-night': '🌨️',
    fog: '🌫️', wind: '💨', hail: '🌨️',
  };
  return map[icon] ?? '🌤️';
}

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

function translateCondition(condition: string, t: TFunction): string {
  const key = CONDITION_KEYS[condition];
  return key ? t(`weather.conditions.${key}`) : condition;
}

function formatDay(dateStr: string, t: TFunction, language: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return t('forecast.today');
  if (date.toDateString() === tomorrow.toDateString()) return t('forecast.tomorrow');
  return date.toLocaleDateString(getIntlLocale(language), { weekday: 'long', day: 'numeric' });
}

function getWindDirection(degrees: number, dirs: string[]): string {
  return dirs[Math.round(degrees / 45) % 8];
}

function formatHour(timeStr: string): string { return timeStr.substring(0, 5); }
function formatSunTime(timeStr: string): string { return timeStr ? timeStr.substring(0, 5) : '--'; }

function getCurrentHourIndex(hours: any[]): number {
  const currentHour = new Date().getHours();
  const idx = hours.findIndex((h) => parseInt(h.time.substring(0, 2)) >= currentHour);
  return idx === -1 ? 0 : idx;
}

function DayExpandable({ day, isToday, theme }: { day: DailyWeather; isToday: boolean; theme: Theme }) {
  const [expanded, setExpanded] = useState(isToday);
  const { t, i18n } = useTranslation();
  const s = makeStyles(theme);
  const windDirs = t('weather.windDirections', { returnObjects: true }) as string[];
  const feelsLikeAbbr = t('forecast.feelsLikeAbbr');

  const visibleHours = isToday
    ? day.hours.slice(Math.max(0, getCurrentHourIndex(day.hours)))
    : day.hours;

  return (
    <View style={s.dayBlock}>
      <TouchableOpacity style={s.dayRow} onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
        <View style={s.dayLeft}>
          <Text style={s.dayName}>{formatDay(day.date, t, i18n.language)}</Text>
          <Text style={s.windText}>💨 {day.windSpeed} km/h {getWindDirection(day.windDir, windDirs)}</Text>
        </View>
        <Text style={s.dayEmoji}>{getWeatherEmoji(day.icon)}</Text>
        <View style={s.dayRight}>
          {day.precipProb > 20 && <Text style={s.dayPrecip}>💧{day.precipProb}%</Text>}
          <View style={s.tempRange}>
            <Text style={s.tempMax}>{day.tempMax}°</Text>
            <Text style={s.tempMin}>{day.tempMin}°</Text>
          </View>
        </View>
        <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={s.daySummary}>
          <View style={s.summaryRow}>
            <Text style={s.summaryItem}>🌅 {formatSunTime(day.sunrise)}</Text>
            <Text style={s.summaryItem}>🌇 {formatSunTime(day.sunset)}</Text>
            <Text style={s.summaryItem}>💧 {day.humidity}%</Text>
            <Text style={s.summaryItem}>☀️ UV {day.uvIndex}</Text>
          </View>
          {day.description ? <Text style={s.dayDescription}>{day.description}</Text> : null}
        </View>
      )}

      {expanded && (
        <View style={s.hoursContainer}>
          {visibleHours.map((hour) => (
            <View key={hour.time} style={s.hourRow}>
              <Text style={s.hourTime}>{formatHour(hour.time)}</Text>
              <Text style={s.hourEmoji}>{getWeatherEmoji(hour.icon)}</Text>
              <View style={s.hourBar}>
                <View style={s.hourMainRow}>
                  <Text style={s.hourConditions}>{translateCondition(hour.conditions, t)}</Text>
                  {hour.precipProb > 20 && <Text style={s.precipText}>🌂 {hour.precipProb}%</Text>}
                </View>
                <View style={s.hourDetailRow}>
                  <Text style={s.windText}>💨 {hour.windSpeed} km/h {getWindDirection(hour.windDir, windDirs)}</Text>
                  <Text style={s.detailText}>🌡️ {feelsLikeAbbr} {hour.feelsLike}°</Text>
                  <Text style={s.detailText}>💧 {hour.humidity}%</Text>
                </View>
              </View>
              <Text style={s.hourTemp}>{hour.temp}°</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ForecastScreen() {
  const { weatherData, isLoading } = useWeather();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const s = makeStyles(theme);

  if (isLoading && !weatherData) {
    return (
      <SafeAreaView style={s.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </SafeAreaView>
    );
  }

  if (!weatherData) return null;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.screenTitle}>{t('forecast.title')}</Text>
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('forecast.upcomingDays')}</Text>
          <View style={s.dailyList}>
            {weatherData.daily.slice(0, 7).map((day, index) => (
              <DayExpandable key={day.date} day={day} isToday={index === 0} theme={theme} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    scroll: { padding: Spacing.md, gap: Spacing.lg },
    screenTitle: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: theme.textPrimary },
    section: { gap: Spacing.sm },
    sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
    dailyList: { backgroundColor: theme.card, borderRadius: Radius.lg, overflow: 'hidden' },
    dayBlock: { borderBottomWidth: 1, borderBottomColor: theme.border },
    dayRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
    dayLeft: { flex: 1, gap: 2 },
    dayRight: { alignItems: 'flex-end', gap: 2 },
    dayName: { fontSize: Typography.md, fontWeight: Typography.medium, color: theme.textPrimary, textTransform: 'capitalize' },
    dayEmoji: { fontSize: Typography.lg, width: 28, textAlign: 'center' },
    dayPrecip: { fontSize: Typography.xs, color: theme.rain, fontWeight: Typography.medium },
    tempRange: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', minWidth: 70 },
    tempMax: { fontSize: Typography.md, fontWeight: Typography.bold, color: theme.textPrimary, width: 32, textAlign: 'right' },
    tempMin: { fontSize: Typography.md, color: theme.textSecondary, width: 32, textAlign: 'right' },
    chevron: { fontSize: 10, color: theme.textSecondary, width: 12, textAlign: 'center' },
    daySummary: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.border, gap: Spacing.xs },
    summaryRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
    summaryItem: { fontSize: Typography.xs, color: theme.textSecondary, fontWeight: Typography.medium },
    dayDescription: { fontSize: Typography.xs, color: theme.textSecondary, fontStyle: 'italic', lineHeight: 16 },
    hoursContainer: { borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.background },
    hourRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.border, gap: Spacing.sm },
    hourTime: { fontSize: Typography.sm, color: theme.textSecondary, fontWeight: Typography.medium, width: 44 },
    hourEmoji: { fontSize: Typography.lg, width: 28, textAlign: 'center' },
    hourBar: { flex: 1, gap: 3 },
    hourMainRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    hourDetailRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
    precipText: { fontSize: Typography.xs, color: theme.rain, fontWeight: Typography.medium },
    hourConditions: { fontSize: Typography.xs, color: theme.textSecondary, flex: 1 },
    hourTemp: { fontSize: Typography.md, fontWeight: Typography.bold, color: theme.textPrimary, width: 36, textAlign: 'right' },
    windText: { fontSize: Typography.xs, color: theme.wind, fontWeight: Typography.medium },
    detailText: { fontSize: Typography.xs, color: theme.textSecondary },
  });
}