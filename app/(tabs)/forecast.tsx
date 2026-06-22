import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeather } from '../../hooks/useWeather';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { DailyWeather } from '../../services/weatherApi';

function getWeatherEmoji(icon: string): string {
  const map: Record<string, string> = {
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
  return map[icon] ?? '🌤️';
}

function translateCondition(condition: string): string {
  const map: Record<string, string> = {
    'Clear': 'Despejado',
    'Partially cloudy': 'Parcialmente nublado',
    'Overcast': 'Nublado',
    'Rain': 'Lluvia',
    'Rain, Partially cloudy': 'Lluvia y nubes',
    'Rain, Overcast': 'Lluvia y nublado',
    'Light Rain': 'Lluvia ligera',
    'Heavy Rain': 'Lluvia intensa',
    'Drizzle': 'Llovizna',
    'Snow': 'Nieve',
    'Fog': 'Niebla',
    'Wind': 'Viento',
    'Cloudy': 'Nublado',
    'Thunder': 'Tormenta',
    'Thunder, Rain': 'Tormenta con lluvia',
    'Snow, Freezing Drizzle/Freezing Rain': 'Nieve y aguanieve',
    'Freezing Drizzle/Freezing Rain': 'Aguanieve',
    'Ice': 'Hielo',
    'Hail': 'Granizo',
    'Dust storms': 'Tormenta de polvo',
    'Tornado': 'Tornado',
  };
  return map[condition] ?? condition;
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === tomorrow.toDateString()) return 'Mañana';

  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
}

function getWindDirection(degrees: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(degrees / 45) % 8];
}

function formatHour(timeStr: string): string {
  return timeStr.substring(0, 5);
}

function formatSunTime(timeStr: string): string {
  if (!timeStr) return '--';
  return timeStr.substring(0, 5);
}

function getCurrentHourIndex(hours: any[]): number {
  const now = new Date();
  const currentHour = now.getHours();
  const idx = hours.findIndex((h) => parseInt(h.time.substring(0, 2)) >= currentHour);
  return idx === -1 ? 0 : idx;
}

function DayExpandable({ day, isToday }: { day: DailyWeather; isToday: boolean }) {
  const [expanded, setExpanded] = useState(isToday);

  const visibleHours = isToday
    ? day.hours.slice(Math.max(0, getCurrentHourIndex(day.hours)))
    : day.hours;

  return (
    <View style={styles.dayBlock}>
      {/* Cabecera del día */}
      <TouchableOpacity
        style={styles.dayRow}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.dayLeft}>
          <Text style={styles.dayName}>{formatDay(day.date)}</Text>
          <Text style={styles.windText}>
            💨 {day.windSpeed} km/h {getWindDirection(day.windDir)}
          </Text>
        </View>
        <Text style={styles.dayEmoji}>{getWeatherEmoji(day.icon)}</Text>
        <View style={styles.dayRight}>
          {day.precipProb > 20 && (
            <Text style={styles.dayPrecip}>💧{day.precipProb}%</Text>
          )}
          <View style={styles.tempRange}>
            <Text style={styles.tempMax}>{day.tempMax}°</Text>
            <Text style={styles.tempMin}>{day.tempMin}°</Text>
          </View>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Resumen del día al expandir */}
      {expanded && (
        <View style={styles.daySummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>🌅 {formatSunTime(day.sunrise)}</Text>
            <Text style={styles.summaryItem}>🌇 {formatSunTime(day.sunset)}</Text>
            <Text style={styles.summaryItem}>💧 {day.humidity}%</Text>
            <Text style={styles.summaryItem}>☀️ UV {day.uvIndex}</Text>
          </View>
          {day.description ? (
            <Text style={styles.dayDescription}>{day.description}</Text>
          ) : null}
        </View>
      )}

      {/* Horas desplegables */}
      {expanded && (
        <View style={styles.hoursContainer}>
          {visibleHours.map((hour) => (
            <View key={hour.time} style={styles.hourRow}>
              <Text style={styles.hourTime}>{formatHour(hour.time)}</Text>
              <Text style={styles.hourEmoji}>{getWeatherEmoji(hour.icon)}</Text>
              <View style={styles.hourBar}>
                <View style={styles.hourMainRow}>
                  <Text style={styles.hourConditions}>{translateCondition(hour.conditions)}</Text>
                  {hour.precipProb > 20 && (
                    <Text style={styles.precipText}>🌂 {hour.precipProb}%</Text>
                  )}
                </View>
                <View style={styles.hourDetailRow}>
                  <Text style={styles.windText}>
                    💨 {hour.windSpeed} km/h {getWindDirection(hour.windDir)}
                  </Text>
                  <Text style={styles.detailText}>🌡️ ST {hour.feelsLike}°</Text>
                  <Text style={styles.detailText}>💧 {hour.humidity}%</Text>
                </View>
              </View>
              <Text style={styles.hourTemp}>{hour.temp}°</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ForecastScreen() {
  const { weatherData, isLoading } = useWeather();

  if (isLoading && !weatherData) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  if (!weatherData) return null;

  const { daily } = weatherData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Previsión</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos días</Text>
          <View style={styles.dailyList}>
            {daily.slice(0, 7).map((day, index) => (
              <DayExpandable key={day.date} day={day} isToday={index === 0} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
  },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  screenTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dailyList: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  dayBlock: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dayLeft: {
    flex: 1,
    gap: 2,
  },
  dayRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dayName: {
    fontSize: Typography.md,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  dayEmoji: {
    fontSize: Typography.lg,
    width: 28,
    textAlign: 'center',
  },
  dayPrecip: {
    fontSize: Typography.xs,
    color: Colors.rain,
    fontWeight: Typography.medium,
  },
  tempRange: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    minWidth: 70,
  },
  tempMax: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    width: 32,
    textAlign: 'right',
  },
  tempMin: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
    width: 32,
    textAlign: 'right',
  },
  chevron: {
    fontSize: 10,
    color: Colors.textSecondary,
    width: 12,
    textAlign: 'center',
  },
  daySummary: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  summaryItem: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  dayDescription: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  hoursContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  hourTime: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    width: 44,
  },
  hourEmoji: {
    fontSize: Typography.lg,
    width: 28,
    textAlign: 'center',
  },
  hourBar: {
    flex: 1,
    gap: 3,
  },
  hourMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
hourDetailRow: {
  flexDirection: 'row',
  gap: Spacing.sm,
  alignItems: 'center',
  // quita flexWrap: 'wrap'
},
  precipText: {
    fontSize: Typography.xs,
    color: Colors.rain,
    fontWeight: Typography.medium,
  },
  hourConditions: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  hourTemp: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    width: 36,
    textAlign: 'right',
  },
  windText: {
    fontSize: Typography.xs,
    color: Colors.wind,
    fontWeight: Typography.medium,
  },
  detailText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
});