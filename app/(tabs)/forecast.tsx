import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeather } from '../../hooks/useWeather';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

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

function getCurrentHourIndex(hours: any[]): number {
  const now = new Date();
  const currentHour = now.getHours();
  return hours.findIndex((h) => {
    const hour = parseInt(h.time.substring(0, 2));
    return hour >= currentHour;
  });
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

  const { hourly, daily } = weatherData;

  // Mostrar desde la hora actual
  const startIndex = getCurrentHourIndex(hourly);
  const upcomingHours = hourly.slice(startIndex, startIndex + 24);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <Text style={styles.screenTitle}>Previsión</Text>

        {/* Previsión horaria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Por horas</Text>
          <View style={styles.hourlyList}>
            {upcomingHours.map((hour) => (
              <View key={hour.time} style={styles.hourRow}>
                <Text style={styles.hourTime}>{formatHour(hour.time)}</Text>
                <Text style={styles.hourEmoji}>{getWeatherEmoji(hour.icon)}</Text>
                <View style={styles.hourBar}>
                {hour.precipProb > 20 && (
                    <View style={styles.precipRow}>
                    <Text style={styles.precipText}>🌂 {hour.precipProb}%</Text>
                    </View>
                )}
                <Text style={styles.hourConditions}>{hour.conditions}</Text>
                <Text style={styles.windText}>💨 {hour.windSpeed} km/h {getWindDirection(hour.windDir)}</Text>
                </View>
                <Text style={styles.hourTemp}>{hour.temp}°</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Previsión semanal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos días</Text>
          <View style={styles.dailyList}>
            {daily.slice(0, 7).map((day) => (
              <View key={day.date} style={styles.dayRow}>
                <View style={styles.dayLeft}>
                  <Text style={styles.dayName}>{formatDay(day.date)}</Text>
                  <Text style={styles.windText}>💨 {day.windSpeed} km/h {getWindDirection(day.windDir)}</Text>
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
              </View>
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
  hourlyList: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    overflow: 'hidden',
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
    gap: 2,
  },
  precipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  precipText: {
    fontSize: Typography.xs,
    color: Colors.rain,
    fontWeight: Typography.medium,
  },
  hourConditions: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
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
dayLeft: {
  flex: 1,
  gap: 2,
},
dayRight: {
  alignItems: 'flex-end',
  gap: 2,
},
  dailyList: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  dayName: {
    fontSize: Typography.md,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    width: 90,
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
    width: 48,
    textAlign: 'center',
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
});