import {
  View,
  Text,
  ScrollView,
  RefreshControl,
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

export default function HomeScreen() {
  const { weatherData, isLoading, error, refresh, units } = useWeather();

  const unitLabel = units === 'metric' ? '°C' : '°F';
  const windLabel = units === 'metric' ? 'km/h' : 'mph';

  if (isLoading && !weatherData) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Obteniendo el tiempo...</Text>
      </SafeAreaView>
    );
  }

  if (error && !weatherData) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!weatherData) return null;

  const { current, hourly, location } = weatherData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera */}
        <View style={styles.header}>
          <Text style={styles.locationText}>📍 {location}</Text>
        </View>

        {/* Temperatura principal */}
        <View style={styles.mainCard}>
          <Text style={styles.weatherEmoji}>
            {getWeatherEmoji(current.icon)}
          </Text>
          <Text style={styles.tempText}>
            {current.temp}{unitLabel}
          </Text>
          <Text style={styles.conditionsText}>{current.conditions}</Text>
          <Text style={styles.feelsLikeText}>
            Sensación {current.feelsLike}{unitLabel}
          </Text>
          <Text style={styles.descriptionText}>{current.description}</Text>
        </View>

        {/* Datos rápidos */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💧</Text>
            <Text style={styles.statValue}>{current.humidity}%</Text>
            <Text style={styles.statLabel}>Humedad</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💨</Text>
            <Text style={styles.statValue}>{current.windSpeed} {windLabel}</Text>
            <Text style={styles.statLabel}>Viento</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🌂</Text>
            <Text style={styles.statValue}>{current.precipProb}%</Text>
            <Text style={styles.statLabel}>Lluvia</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔆</Text>
            <Text style={styles.statValue}>{current.uvIndex}</Text>
            <Text style={styles.statLabel}>UV</Text>
          </View>
        </View>

        {/* Previsión horaria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas horas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {hourly.slice(hourly.findIndex(h => parseInt(h.time.substring(0, 2)) >= new Date().getHours()), hourly.findIndex(h => parseInt(h.time.substring(0, 2)) >= new Date().getHours()) + 12).map((hour) => (
              <View key={hour.time} style={styles.hourCard}>
                <Text style={styles.hourTime}>
                  {hour.time.substring(0, 5)}
                </Text>
                <Text style={styles.hourEmoji}>
                  {getWeatherEmoji(hour.icon)}
                </Text>
                <Text style={styles.hourTemp}>
                  {hour.temp}{unitLabel}
                </Text>
                {hour.precipProb > 20 && (
                  <Text style={styles.hourPrecip}>{hour.precipProb}%</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Sol */}
        <View style={styles.sunRow}>
          <View style={styles.sunCard}>
            <Text style={styles.sunEmoji}>🌅</Text>
            <Text style={styles.sunLabel}>Amanecer</Text>
            <Text style={styles.sunTime}>{current.sunrise}</Text>
          </View>
          <View style={styles.sunCard}>
            <Text style={styles.sunEmoji}>🌇</Text>
            <Text style={styles.sunLabel}>Atardecer</Text>
            <Text style={styles.sunTime}>{current.sunset}</Text>
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
    gap: Spacing.md,
  },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  locationText: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  mainCard: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  weatherEmoji: {
    fontSize: 72,
  },
  tempText: {
    fontSize: Typography.huge,
    fontWeight: Typography.bold,
    color: Colors.textLight,
  },
  conditionsText: {
    fontSize: Typography.lg,
    color: Colors.textLight,
    fontWeight: Typography.medium,
  },
  feelsLikeText: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  descriptionText: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statEmoji: {
    fontSize: Typography.lg,
  },
  statValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  hourCard: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    marginRight: Spacing.sm,
    minWidth: 64,
    gap: 4,
  },
  hourTime: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  hourEmoji: {
    fontSize: Typography.xl,
  },
  hourTemp: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  hourPrecip: {
    fontSize: Typography.xs,
    color: Colors.rain,
    fontWeight: Typography.medium,
  },
  sunRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sunCard: {
    flex: 1,
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  sunEmoji: {
    fontSize: Typography.xl,
  },
  sunLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  sunTime: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  loadingText: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorText: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});