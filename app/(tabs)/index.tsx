import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeather } from '../../hooks/useWeather';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing, Radius } from '../../constants/theme';
import { searchCities, CityResult } from '../../services/weatherApi';

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
  const { weatherData, isLoading, error, refresh, units, isManualLocation, searchAndLoadCity, backToGPS } = useWeather();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unitLabel = units === 'metric' ? '°C' : '°F';
  const windLabel = units === 'metric' ? 'km/h' : 'mph';

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchCities(text);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);
  }, []);

  const handleSelectCity = useCallback(async (city: CityResult) => {
    Keyboard.dismiss();
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    await searchAndLoadCity(city.latitude, city.longitude, city.name);
  }, [searchAndLoadCity]);

  const handleBackToGPS = useCallback(async () => {
    await backToGPS();
    refresh();
  }, [backToGPS, refresh]);

  const s = makeStyles(theme);

  if (isLoading && !weatherData) {
    return (
      <SafeAreaView style={s.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={s.loadingText}>{t('home.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (error && !weatherData) {
    return (
      <SafeAreaView style={s.centered}>
        <Text style={s.errorEmoji}>😕</Text>
        <Text style={s.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!weatherData) return null;

  const { current, hourly, location } = weatherData;

  return (
    <SafeAreaView style={s.container}>
      {showSearch ? (
        <View style={s.searchContainer}>
          <View style={s.searchRow}>
            <TextInput
              style={s.searchInput}
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoFocus
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); Keyboard.dismiss(); }}
              style={s.cancelButton}
            >
              <Text style={s.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
          {isSearching && <ActivityIndicator size="small" color={theme.accent} style={{ marginTop: Spacing.sm }} />}
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => `${item.latitude}-${item.longitude}`}
              style={s.resultsList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={s.resultItem} onPress={() => handleSelectCity(item)}>
                  <Text style={s.resultName}>{item.name}</Text>
                  <Text style={s.resultRegion}>{[item.region, item.country].filter(Boolean).join(', ')}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={theme.accent} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.header}>
            <TouchableOpacity onPress={() => setShowSearch(true)} style={s.locationRow}>
              <Text style={s.locationText}>📍 {location}</Text>
              <Text style={s.searchIcon}>🔍</Text>
            </TouchableOpacity>
            {isManualLocation && (
              <TouchableOpacity onPress={handleBackToGPS} style={s.gpsButton}>
                <Text style={s.gpsButtonText}>{t('home.useMyLocation')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.mainCard}>
            <Text style={s.weatherEmoji}>{getWeatherEmoji(current.icon)}</Text>
            <Text style={s.tempText}>{current.temp}{unitLabel}</Text>
            <Text style={s.conditionsText}>{current.conditions}</Text>
            <Text style={s.feelsLikeText}>{t('home.feelsLike', { value: current.feelsLike, unit: unitLabel })}</Text>
            <Text style={s.descriptionText}>{current.description}</Text>
          </View>

          <View style={s.statsRow}>
            {[
              { emoji: '💧', value: `${current.humidity}%`, label: t('home.stats.humidity') },
              { emoji: '💨', value: `${current.windSpeed} ${windLabel}`, label: t('home.stats.wind') },
              { emoji: '🌂', value: `${current.precipProb}%`, label: t('home.stats.rain') },
              { emoji: '🔆', value: `${current.uvIndex}`, label: t('home.stats.uv') },
            ].map((stat) => (
              <View key={stat.label} style={s.statCard}>
                <Text style={s.statEmoji}>{stat.emoji}</Text>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('home.upcomingHours')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {hourly
                .slice(
                  hourly.findIndex(h => parseInt(h.time.substring(0, 2)) >= new Date().getHours()),
                  hourly.findIndex(h => parseInt(h.time.substring(0, 2)) >= new Date().getHours()) + 12
                )
                .map((hour) => (
                  <View key={hour.time} style={s.hourCard}>
                    <Text style={s.hourTime}>{hour.time.substring(0, 5)}</Text>
                    <Text style={s.hourEmoji}>{getWeatherEmoji(hour.icon)}</Text>
                    <Text style={s.hourTemp}>{hour.temp}{unitLabel}</Text>
                    {hour.precipProb > 20 && <Text style={s.hourPrecip}>{hour.precipProb}%</Text>}
                  </View>
                ))}
            </ScrollView>
          </View>

          <View style={s.sunRow}>
            <View style={s.sunCard}>
              <Text style={s.sunEmoji}>🌅</Text>
              <Text style={s.sunLabel}>{t('home.sunrise')}</Text>
              <Text style={s.sunTime}>{current.sunrise}</Text>
            </View>
            <View style={s.sunCard}>
              <Text style={s.sunEmoji}>🌇</Text>
              <Text style={s.sunLabel}>{t('home.sunset')}</Text>
              <Text style={s.sunTime}>{current.sunset}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof import('../../hooks/useTheme').useTheme>['theme']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, gap: Spacing.md },
    scroll: { padding: Spacing.md, gap: Spacing.md },
    header: { alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.xs },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    locationText: { fontSize: Typography.md, color: theme.textSecondary, fontWeight: Typography.medium },
    searchIcon: { fontSize: Typography.md },
    gpsButton: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: theme.accent, borderRadius: Radius.full },
    gpsButtonText: { fontSize: Typography.xs, color: theme.textLight, fontWeight: Typography.medium },
    searchContainer: { flex: 1, padding: Spacing.md },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    searchInput: { flex: 1, backgroundColor: theme.card, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.md, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border },
    cancelButton: { paddingVertical: Spacing.sm },
    cancelText: { fontSize: Typography.sm, color: theme.accent, fontWeight: Typography.medium },
    resultsList: { marginTop: Spacing.sm, backgroundColor: theme.card, borderRadius: Radius.md, borderWidth: 1, borderColor: theme.border },
    resultItem: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
    resultName: { fontSize: Typography.md, color: theme.textPrimary, fontWeight: Typography.medium },
    resultRegion: { fontSize: Typography.xs, color: theme.textSecondary, marginTop: 2 },
    mainCard: { backgroundColor: theme.accent, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.xs },
    weatherEmoji: { fontSize: 72 },
    tempText: { fontSize: Typography.huge, fontWeight: Typography.bold, color: theme.textLight },
    conditionsText: { fontSize: Typography.lg, color: theme.textLight, fontWeight: Typography.medium },
    feelsLikeText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)' },
    descriptionText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: Spacing.xs },
    statsRow: { flexDirection: 'row', gap: Spacing.sm },
    statCard: { flex: 1, backgroundColor: theme.card, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', gap: 2 },
    statEmoji: { fontSize: Typography.lg },
    statValue: { fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.textPrimary },
    statLabel: { fontSize: Typography.xs, color: theme.textSecondary },
    section: { gap: Spacing.sm },
    sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textPrimary },
    hourCard: { backgroundColor: theme.card, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', marginRight: Spacing.sm, minWidth: 64, gap: 4 },
    hourTime: { fontSize: Typography.xs, color: theme.textSecondary, fontWeight: Typography.medium },
    hourEmoji: { fontSize: Typography.xl },
    hourTemp: { fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.textPrimary },
    hourPrecip: { fontSize: Typography.xs, color: theme.rain, fontWeight: Typography.medium },
    sunRow: { flexDirection: 'row', gap: Spacing.sm },
    sunCard: { flex: 1, backgroundColor: theme.card, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', gap: 4 },
    sunEmoji: { fontSize: Typography.xl },
    sunLabel: { fontSize: Typography.xs, color: theme.textSecondary },
    sunTime: { fontSize: Typography.md, fontWeight: Typography.bold, color: theme.textPrimary },
    loadingText: { fontSize: Typography.md, color: theme.textSecondary },
    errorEmoji: { fontSize: 48 },
    errorText: { fontSize: Typography.md, color: theme.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
  });
}