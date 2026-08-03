import { useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { fetchWeather, WeatherData } from '../services/weatherApi';
import { useWeatherStore } from '../store/weatherStore';
import { loadActiveAlerts } from '../services/alertsStorage';
import { evaluateAlert, notifyTriggeredAlerts } from '../services/alertEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DURATION = 30 * 60 * 1000;

async function checkAndNotify(data: WeatherData) {
  try {
    const activeAlerts = await loadActiveAlerts();
    const savedThresholds = await AsyncStorage.getItem('thresholds');
    if (activeAlerts.length === 0 || !savedThresholds) return;

    const thresholds = JSON.parse(savedThresholds);
    const triggered = activeAlerts
      .map((type) => evaluateAlert(type, thresholds[type], data.current))
      .filter((e) => e.triggered);

    await notifyTriggeredAlerts(triggered, { respectDoNotDisturb: true });
  } catch (e) {
    console.error('Error checking alert:', e);
  }
}

export function useWeather() {
  const { t, i18n: i18nInstance } = useTranslation();
  const {
    weatherData,
    location,
    isLoading,
    error,
    units,
    lastUpdated,
    isManualLocation,
    setWeatherData,
    setLocation,
    setLoading,
    setError,
    resetToGPS,
  } = useWeatherStore();

  const isCacheValid = useCallback(() => {
    if (!lastUpdated) return false;
    return Date.now() - lastUpdated < CACHE_DURATION;
  }, [lastUpdated]);

  const requestLocationPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError(t('errors.locationPermissionDenied'));
      return false;
    }
    return true;
  }, [setError, t]);

  const loadWeather = useCallback(
    async (forceRefresh = false, forceGPS = false) => {
      if (!forceRefresh && isCacheValid() && weatherData) return;

      setLoading(true);

      try {
        let latitude: number;
        let longitude: number;

        if (!forceGPS && isManualLocation && location) {
          // Usar coordenadas de la ciudad seleccionada manualmente
          latitude = location.latitude;
          longitude = location.longitude;
        } else {
          // Usar GPS
          const hasPermission = await requestLocationPermission();
          if (!hasPermission) return;

          const coords = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          latitude = coords.coords.latitude;
          longitude = coords.coords.longitude;
          setLocation({ latitude, longitude });
        }

        const data = await fetchWeather(latitude, longitude, units);
        setWeatherData(data);
        await checkAndNotify(data);
      } catch (err) {
        setError(t('errors.weatherFetchFailed'));
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    [isCacheValid, weatherData, units, isManualLocation, location, setLoading, setLocation, setWeatherData, setError, requestLocationPermission, t]
  );

  const backToGPS = useCallback(async () => {
    resetToGPS();
    await loadWeather(true, true);
  }, [resetToGPS, loadWeather]);

  const searchAndLoadCity = useCallback(
    async (cityLatitude: number, cityLongitude: number, cityName: string) => {
      setLoading(true);
      try {
        setLocation({ latitude: cityLatitude, longitude: cityLongitude, name: cityName }, true);
        const data = await fetchWeather(cityLatitude, cityLongitude, units);
        setWeatherData(data);
      } catch (err) {
        setError(t('errors.weatherFetchFailedCity'));
      } finally {
        setLoading(false);
      }
    },
    [units, setLoading, setLocation, setWeatherData, setError, t]
  );

  useEffect(() => {
    loadWeather();
  }, []);

  useEffect(() => {
    if (weatherData) loadWeather(true);
  }, [units]);

  useEffect(() => {
    if (weatherData) loadWeather(true);
  }, [i18nInstance.language]);

  return {
    weatherData,
    location,
    isLoading,
    error,
    units,
    isManualLocation,
    refresh: () => loadWeather(true),
    searchAndLoadCity,
    backToGPS,
  };
}