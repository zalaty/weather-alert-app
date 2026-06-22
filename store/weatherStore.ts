import { create } from 'zustand';
import { WeatherData } from '../services/weatherApi';

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
  units: 'metric' | 'us';
  lastUpdated: number | null;
  isManualLocation: boolean;

  setWeatherData: (data: WeatherData) => void;
  setLocation: (location: Location, isManual?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleUnits: () => void;
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

  setWeatherData: (data) =>
    set({ weatherData: data, lastUpdated: Date.now(), error: null }),

  setLocation: (location, isManual = false) =>
    set({ location, isManualLocation: isManual }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  toggleUnits: () =>
    set((state) => ({ units: state.units === 'metric' ? 'us' : 'metric' })),

  clearError: () => set({ error: null }),

  resetToGPS: () =>
    set({ isManualLocation: false, lastUpdated: null }),
}));