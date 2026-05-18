import { create } from 'zustand';
import { WeatherData } from '../services/weatherApi';

interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

interface WeatherStore {
  // Estado
  weatherData: WeatherData | null;
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  units: 'metric' | 'us';
  lastUpdated: number | null;

  // Acciones
  setWeatherData: (data: WeatherData) => void;
  setLocation: (location: Location) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleUnits: () => void;
  clearError: () => void;
}

export const useWeatherStore = create<WeatherStore>((set) => ({
  // Estado inicial
  weatherData: null,
  location: null,
  isLoading: false,
  error: null,
  units: 'metric',
  lastUpdated: null,

  // Acciones
  setWeatherData: (data) =>
    set({ weatherData: data, lastUpdated: Date.now(), error: null }),

  setLocation: (location) => set({ location }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  toggleUnits: () =>
    set((state) => ({ units: state.units === 'metric' ? 'us' : 'metric' })),

  clearError: () => set({ error: null }),
}));