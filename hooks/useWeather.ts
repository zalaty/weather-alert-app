import { useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { fetchWeather, WeatherData } from '../services/weatherApi';
import { useWeatherStore } from '../store/weatherStore';
import { scheduleWeatherAlert } from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '../i18n';

const CACHE_DURATION = 30 * 60 * 1000;

async function checkAndNotify(data: WeatherData) {
  try {
    const savedAlert = await AsyncStorage.getItem('activeAlert');
    const savedThresholds = await AsyncStorage.getItem('thresholds');
    if (!savedAlert || !savedThresholds) return;

    const type = savedAlert as 'rain' | 'wind' | 'temp_low' | 'temp_high';
    const thresholds = JSON.parse(savedThresholds);
    const threshold = thresholds[type];
    const { current } = data;

    let triggered = false;
    let body = '';

    switch (type) {
      case 'rain':
        triggered = current.precipProb >= threshold;
        body = i18n.t('alerts.notifications.rainBody', { value: current.precipProb });
        break;
      case 'wind':
        triggered = current.windSpeed >= threshold;
        body = i18n.t('alerts.notifications.windBody', { value: current.windSpeed });
        break;
      case 'temp_low':
        triggered = current.temp <= threshold;
        body = i18n.t('alerts.notifications.tempLowBody', { value: current.temp });
        break;
      case 'temp_high':
        triggered = current.temp >= threshold;
        body = i18n.t('alerts.notifications.tempHighBody', { value: current.temp });
        break;
    }

    if (triggered) {
      const label = i18n.t(`alerts.types.${type}.label`);
      const title = i18n.t('alerts.notifications.title', { label });
      await scheduleWeatherAlert(title, body);
    }
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
    async (forceRefresh = false) => {
      if (!forceRefresh && isCacheValid() && weatherData) return;

      setLoading(true);

      try {
        let latitude: number;
        let longitude: number;

        if (isManualLocation && location) {
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

  const backToGPS = useCallback(async () => {
    resetToGPS();
  }, [resetToGPS]);

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