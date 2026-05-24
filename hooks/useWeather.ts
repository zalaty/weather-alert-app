import { useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { fetchWeather, WeatherData } from '../services/weatherApi';
import { useWeatherStore } from '../store/weatherStore';
import { scheduleWeatherAlert } from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

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
    let title = '';
    let body = '';

    switch (type) {
      case 'rain':
        triggered = current.precipProb >= threshold;
        title = '⚠️ Alerta: Lluvia';
        body = `Probabilidad de lluvia: ${current.precipProb}%`;
        break;
      case 'wind':
        triggered = current.windSpeed >= threshold;
        title = '⚠️ Alerta: Viento fuerte';
        body = `Viento actual: ${current.windSpeed} km/h`;
        break;
      case 'temp_low':
        triggered = current.temp <= threshold;
        title = '⚠️ Alerta: Temperatura mínima';
        body = `Temperatura actual: ${current.temp}°C`;
        break;
      case 'temp_high':
        triggered = current.temp >= threshold;
        title = '⚠️ Alerta: Temperatura máxima';
        body = `Temperatura actual: ${current.temp}°C`;
        break;
    }

    if (triggered) {
      await scheduleWeatherAlert(title, body);
    }
  } catch (e) {
    console.error('Error checking alert:', e);
  }
}

export function useWeather() {
  const {
    weatherData,
    location,
    isLoading,
    error,
    units,
    lastUpdated,
    setWeatherData,
    setLocation,
    setLoading,
    setError,
  } = useWeatherStore();

  const isCacheValid = useCallback(() => {
    if (!lastUpdated) return false;
    return Date.now() - lastUpdated < CACHE_DURATION;
  }, [lastUpdated]);

  const requestLocationPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Permiso de ubicación denegado. Actívalo en ajustes.');
      return false;
    }
    return true;
  }, [setError]);

  const loadWeather = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh && isCacheValid() && weatherData) return;

      setLoading(true);

      try {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) return;

        const coords = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = coords.coords;
        setLocation({ latitude, longitude });

        const data = await fetchWeather(latitude, longitude, units);
        setWeatherData(data);
        await checkAndNotify(data);
      } catch (err) {
        setError('No se pudo obtener el tiempo. Comprueba tu conexión.');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    [isCacheValid, weatherData, units, setLoading, setLocation, setWeatherData, setError, requestLocationPermission]
  );

  useEffect(() => {
    loadWeather();
  }, []);

  useEffect(() => {
    if (weatherData) loadWeather(true);
  }, [units]);

  return {
    weatherData,
    location,
    isLoading,
    error,
    units,
    refresh: () => loadWeather(true),
  };
}