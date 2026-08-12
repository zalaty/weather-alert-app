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
import { useIsPremium } from '../../hooks/useIsPremium';
import { Typography, Spacing, Radius, Theme } from '../../constants/theme';
import { AirQuality, DailyWeather, HourlyWeather } from '../../services/weatherApi';
import { getIntlLocale } from '../../i18n';
import { getWindDirection } from '../../utils/wind';
import { getWeatherEmoji } from '../../utils/weatherIcons';
import { translateCondition } from '../../utils/weatherConditions';
import { getAqiCategory, getAqiSeverity, getAqiSeverityIcon } from '../../utils/airQuality';
import { trackEvent } from '../../services/analytics';
import MetricSelector, { WeatherMetric } from '../../components/weather/MetricSelector';
import Paywall from '../../components/Paywall';

function formatDay(dateStr: string, t: TFunction, language: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return t('forecast.today');
  if (date.toDateString() === tomorrow.toDateString()) return t('forecast.tomorrow');
  return date.toLocaleDateString(getIntlLocale(language), { weekday: 'long', day: 'numeric' });
}

function formatHour(timeStr: string): string { return timeStr.substring(0, 5); }
function formatSunTime(timeStr: string): string { return timeStr ? timeStr.substring(0, 5) : '--'; }

function getCurrentHourIndex(hours: HourlyWeather[]): number {
  const currentHour = new Date().getHours();
  const idx = hours.findIndex((h) => parseInt(h.time.substring(0, 2)) >= currentHour);
  return idx === -1 ? 0 : idx;
}

function getAqiColor(theme: Theme, aqiUs: number): string {
  const severity = getAqiSeverity(getAqiCategory(aqiUs));
  return { good: theme.aqiGood, moderate: theme.aqiModerate, unhealthy: theme.aqiUnhealthy }[severity];
}

function AqiMini({ aqiUs, theme, s }: { aqiUs: number | undefined; theme: Theme; s: any }) {
  if (aqiUs == null) return <Text style={s.aqiMiniMuted}>—</Text>;
  const severity = getAqiSeverity(getAqiCategory(aqiUs));
  return (
    <View style={s.aqiMiniRow}>
      <Text style={s.aqiMiniIcon}>{getAqiSeverityIcon(severity)}</Text>
      <Text style={[s.aqiMiniText, { color: getAqiColor(theme, aqiUs) }]}>{aqiUs}</Text>
    </View>
  );
}

function AqiFullDetail({ airQuality, theme, s, t }: { airQuality: AirQuality; theme: Theme; s: any; t: TFunction }) {
  const category = getAqiCategory(airQuality.aqiUs);
  const severity = getAqiSeverity(category);
  return (
    <View style={s.aqiDetailBlock}>
      <Text style={s.aqiDetailTitle}>
        {getAqiSeverityIcon(severity)} {t(`weatherDetails.airQuality.categories.${category}`)} ({airQuality.aqiUs})
      </Text>
      <Text style={s.aqiDetailText}>{t(`weatherDetails.airQuality.recommendations.${category}`)}</Text>
    </View>
  );
}

function DaySecondary({ day, metric, theme, windDirs, t, s }: {
  day: DailyWeather; metric: WeatherMetric; theme: Theme; windDirs: string[]; t: TFunction; s: any;
}) {
  if (metric === 'wind') {
    return <Text style={s.windText}>💨 {day.windSpeed} km/h {getWindDirection(day.windDir, windDirs)}</Text>;
  }
  if (metric === 'air') {
    return <AqiMini aqiUs={day.airQuality?.aqiUs} theme={theme} s={s} />;
  }
  return <Text style={s.windText}>💧 {day.humidity}%</Text>;
}

function HourSecondary({ hour, metric, windDirs, feelsLikeAbbr, theme, s }: {
  hour: HourlyWeather; metric: WeatherMetric; windDirs: string[]; feelsLikeAbbr: string; theme: Theme; s: any;
}) {
  if (metric === 'wind') {
    return <Text style={s.windText}>💨 {hour.windSpeed} km/h {getWindDirection(hour.windDir, windDirs)}</Text>;
  }
  if (metric === 'air') {
    return <AqiMini aqiUs={hour.airQuality?.aqiUs} theme={theme} s={s} />;
  }
  return <Text style={s.detailText}>🌡️ {feelsLikeAbbr} {hour.feelsLike}°</Text>;
}

function HourRow({ hour, metric, theme, s, t, windDirs }: {
  hour: HourlyWeather; metric: WeatherMetric; theme: Theme; s: any; t: TFunction; windDirs: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const feelsLikeAbbr = t('forecast.feelsLikeAbbr');

  return (
    <View style={s.hourBlock}>
      <TouchableOpacity style={s.hourRow} onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
        <Text style={s.hourTime}>{formatHour(hour.time)}</Text>
        <Text style={s.hourEmoji}>{getWeatherEmoji(hour.icon)}</Text>
        <View style={s.hourBar}>
          <View style={s.hourMainRow}>
            <Text style={s.hourConditions}>{translateCondition(hour.conditions, t)}</Text>
            {hour.precipProb > 20 && <Text style={s.precipText}>🌂 {hour.precipProb}%</Text>}
          </View>
          <HourSecondary hour={hour} metric={metric} windDirs={windDirs} feelsLikeAbbr={feelsLikeAbbr} theme={theme} s={s} />
        </View>
        <Text style={s.hourTemp}>{hour.temp}°</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={s.hourDetailPanel}>
          <View style={s.summaryRow}>
            <Text style={s.summaryItem}>💨 {hour.windSpeed} km/h {getWindDirection(hour.windDir, windDirs)}</Text>
            <Text style={s.summaryItem}>🌡️ {feelsLikeAbbr} {hour.feelsLike}°</Text>
            <Text style={s.summaryItem}>💧 {hour.humidity}%</Text>
            <Text style={s.summaryItem}>☀️ UV {hour.uvIndex}</Text>
          </View>
          {hour.airQuality && <AqiFullDetail airQuality={hour.airQuality} theme={theme} s={s} t={t} />}
        </View>
      )}
    </View>
  );
}

function DayExpandable({ day, isToday, theme, metric }: { day: DailyWeather; isToday: boolean; theme: Theme; metric: WeatherMetric }) {
  const [expanded, setExpanded] = useState(isToday);
  const { t, i18n } = useTranslation();
  const s = makeStyles(theme);
  const windDirs = t('weather.windDirections', { returnObjects: true }) as string[];

  const visibleHours = isToday
    ? day.hours.slice(Math.max(0, getCurrentHourIndex(day.hours)))
    : day.hours;

  return (
    <View style={s.dayBlock}>
      <TouchableOpacity style={s.dayRow} onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
        <View style={s.dayLeft}>
          <Text style={s.dayName}>{formatDay(day.date, t, i18n.language)}</Text>
          <DaySecondary day={day} metric={metric} theme={theme} windDirs={windDirs} t={t} s={s} />
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
          {day.airQuality && <AqiFullDetail airQuality={day.airQuality} theme={theme} s={s} t={t} />}
        </View>
      )}

      {expanded && (
        <View style={s.hoursContainer}>
          {visibleHours.map((hour) => (
            <HourRow key={hour.time} hour={hour} metric={metric} theme={theme} s={s} t={t} windDirs={windDirs} />
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
  const isPremium = useIsPremium();
  const [metric, setMetric] = useState<WeatherMetric>('temp');
  const [paywallVisible, setPaywallVisible] = useState(false);
  const s = makeStyles(theme);

  const handleRequestPaywall = () => {
    trackEvent('air_quality_gate_reached');
    setPaywallVisible(true);
  };

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

        <MetricSelector
          selected={metric}
          onSelect={setMetric}
          isPremium={isPremium}
          onRequestPaywall={handleRequestPaywall}
        />

        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('forecast.upcomingDays')}</Text>
          <View style={s.dailyList}>
            {weatherData.daily.slice(0, 7).map((day, index) => (
              <DayExpandable key={day.date} day={day} isToday={index === 0} theme={theme} metric={metric} />
            ))}
          </View>
        </View>
      </ScrollView>

      <Paywall visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
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
    hourBlock: { borderBottomWidth: 1, borderBottomColor: theme.border },
    hourRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
    hourDetailPanel: { gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, paddingLeft: Spacing.md + 44 },
    hourTime: { fontSize: Typography.sm, color: theme.textSecondary, fontWeight: Typography.medium, width: 44 },
    hourEmoji: { fontSize: Typography.lg, width: 28, textAlign: 'center' },
    hourBar: { flex: 1, gap: 3 },
    hourMainRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    precipText: { fontSize: Typography.xs, color: theme.rain, fontWeight: Typography.medium },
    hourConditions: { fontSize: Typography.xs, color: theme.textSecondary, flex: 1 },
    hourTemp: { fontSize: Typography.md, fontWeight: Typography.bold, color: theme.textPrimary, width: 36, textAlign: 'right' },
    windText: { fontSize: Typography.xs, color: theme.wind, fontWeight: Typography.medium },
    detailText: { fontSize: Typography.xs, color: theme.textSecondary },
    aqiMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    aqiMiniIcon: { fontSize: Typography.sm },
    aqiMiniText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    aqiMiniMuted: { fontSize: Typography.xs, color: theme.textSecondary },
    aqiDetailBlock: { marginTop: Spacing.xs, gap: 2 },
    aqiDetailTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: theme.textPrimary },
    aqiDetailText: { fontSize: Typography.xs, color: theme.textSecondary, lineHeight: 16 },
  });
}
