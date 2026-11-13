import { useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { fetchWeather, WeatherData } from '../services/weatherApi';
import { useWeatherStore } from '../store/weatherStore';
import { replanAlerts } from '../services/alertScheduler';

const CACHE_DURATION = 30 * 60 * 1000;

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
    isFromPersistedCache,
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
      // Los datos restaurados de disco se pintan al instante, pero en el arranque se refrescan
      // siempre: el usuario puede haberse movido desde la última vez que abrió la app.
      if (!forceRefresh && !isFromPersistedCache && isCacheValid() && weatherData) return;

      setLoading(true);

      try {
        let latitude: number;
        let longitude: number;
        let isGpsFetch = false;

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
          isGpsFetch = true;
        }

        const data = await fetchWeather(latitude, longitude, units);
        setWeatherData(data);
        // Las alertas están atadas al GPS: solo un fetch por GPS aporta datos nuevos al
        // planificador. Con una ciudad manual se replanifica igualmente (por si cambió el
        // idioma o las unidades), pero sobre el último dato de GPS conservado.
        await replanAlerts(isGpsFetch ? { gpsData: { weatherData: data, units } } : {});
      } catch (err) {
        setError(t('errors.weatherFetchFailed'));
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    [isCacheValid, weatherData, isFromPersistedCache, units, isManualLocation, location, setLoading, setLocation, setWeatherData, setError, requestLocationPermission, t]
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
    lastUpdated,
    refresh: () => loadWeather(true),
    searchAndLoadCity,
    backToGPS,
  };
}