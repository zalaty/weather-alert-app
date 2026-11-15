import { create } from 'zustand';
import { WeatherData } from '../services/weatherApi';
import type { Units } from '../utils/units';

interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

interface WeatherStore {
  weatherData: WeatherData | null;
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  units: Units;
  lastUpdated: number | null;
  isManualLocation: boolean;
  /** true si weatherData viene de la caché persistida y aún no se ha refrescado en esta sesión */
  isFromPersistedCache: boolean;

  setWeatherData: (data: WeatherData) => void;
  setLocation: (location: Location, isManual?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUnits: (units: Units) => void;
  hydrate: (snapshot: Partial<Pick<WeatherStore, 'units' | 'weatherData' | 'location' | 'lastUpdated'>>) => void;
  clearError: () => void;
  resetToGPS: () => void;
}

export const useWeatherStore = create<WeatherStore>((set) => ({
  weatherData: null,
  location: null,
  isLoading: false,
  error: null,
  units: 'metric',
  lastUpdated: null,
  isManualLocation: false,
  isFromPersistedCache: false,

  setWeatherData: (data) =>
    set({ weatherData: data, lastUpdated: Date.now(), error: null, isFromPersistedCache: false }),

  setLocation: (location, isManual = false) =>
    set({ location, isManualLocation: isManual }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  setUnits: (units) => set({ units }),

  clearError: () => set({ error: null }),

  hydrate: (snapshot) =>
    set({ ...snapshot, isFromPersistedCache: snapshot.weatherData != null }),

  resetToGPS: () =>
    set({ isManualLocation: false, lastUpdated: null }),
}));