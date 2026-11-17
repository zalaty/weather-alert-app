import { pickCurrentHour } from '../utils/currentHour';
import { isRedundantDescription } from '../utils/weatherConditions';
import type { HourlyWeather } from '../services/weatherApi';

const HOUR = 60 * 60 * 1000;
const START = Date.UTC(2026, 10, 16, 0, 0, 0); // 00:00 UTC

function hour(i: number): HourlyWeather {
  return {
    time: `${String(i).padStart(2, '0')}:00:00`,
    epoch: START + i * HOUR,
    temp: 15,
    feelsLike: 15,
    humidity: 70,
    uvIndex: 0,
    precipProb: i * 4,
    precipAmount: 0,
    windSpeed: 10,
    windDir: 0,
    conditions: 'Clear',
    icon: 'clear-day',
  };
}

const day = Array.from({ length: 24 }, (_, i) => hour(i));

describe('pickCurrentHour', () => {
  it('elige la hora que contiene el instante actual', () => {
    expect(pickCurrentHour(day, START + 14 * HOUR + 25 * 60 * 1000)?.time).toBe('14:00:00');
  });

  it('el inicio exacto de una hora pertenece a esa hora, no a la anterior', () => {
    expect(pickCurrentHour(day, START + 9 * HOUR)?.time).toBe('09:00:00');
  });

  it('el último milisegundo de la hora sigue siendo esa hora', () => {
    expect(pickCurrentHour(day, START + 10 * HOUR - 1)?.time).toBe('09:00:00');
  });

  it('no depende de la zona horaria: compara instantes absolutos', () => {
    // La "time" local de la ubicación va 9 h por delante de UTC: manda el epoch.
    const shifted = day.map((h, i) => ({ ...h, time: `${String((i + 9) % 24).padStart(2, '0')}:00:00` }));
    expect(pickCurrentHour(shifted, START + 3 * HOUR + 1)?.time).toBe('12:00:00');
  });

  it('sin hora que contenga el instante (otro día) devuelve undefined', () => {
    expect(pickCurrentHour(day, START + 24 * HOUR)).toBeUndefined();
    expect(pickCurrentHour(day, START - 1)).toBeUndefined();
  });

  it('snapshots antiguos sin epoch: undefined (se usa el valor actual)', () => {
    const old = day.map((h) => ({ ...h, epoch: undefined }));
    expect(pickCurrentHour(old, START + 5 * HOUR)).toBeUndefined();
  });

  it('lista vacía o ausente: undefined', () => {
    expect(pickCurrentHour([], START)).toBeUndefined();
    expect(pickCurrentHour(undefined, START)).toBeUndefined();
  });
});

describe('isRedundantDescription', () => {
  it('ignora mayúsculas, punto final y espacios', () => {
    expect(isRedundantDescription('Clear.', 'Clear')).toBe(true);
    expect(isRedundantDescription('  partially cloudy. ', 'Partially cloudy')).toBe(true);
    expect(isRedundantDescription('Despejado', 'despejado')).toBe(true);
  });

  it('una descripción distinta se muestra', () => {
    expect(isRedundantDescription('Partly cloudy throughout the day.', 'Partially cloudy')).toBe(false);
  });
});
