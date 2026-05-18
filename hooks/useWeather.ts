import { useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { fetchWeather } from '../services/weatherApi';
import { useWeatherStore } from '../store/weatherStore';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

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
      // Si hay caché válida y no forzamos refresco, no llamamos a la API
      if (!forceRefresh && isCacheValid() && weatherData) return;

      setLoading(true);

      try {
        // Obtener ubicación
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) return;

        const coords = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = coords.coords;
        setLocation({ latitude, longitude });

        // Llamar a la API
        const data = await fetchWeather(latitude, longitude, units);
        setWeatherData(data);
      } catch (err) {
        setError('No se pudo obtener el tiempo. Comprueba tu conexión.');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    [isCacheValid, weatherData, units, setLoading, setLocation, setWeatherData, setError, requestLocationPermission]
  );

  // Cargar al montar
  useEffect(() => {
    loadWeather();
  }, []);

  // Recargar si cambian las unidades
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