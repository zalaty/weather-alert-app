import { getUnitLabels, Units } from '../utils/units';
import { alertUnitLabel, formatAlertValue } from '../utils/alertUnits';

describe('getUnitLabels', () => {
  it('métrico: °C, km/h, mm', () => {
    expect(getUnitLabels('metric')).toEqual({ temp: '°C', wind: 'km/h', precip: 'mm' });
  });

  it('imperial: °F, mph, in', () => {
    expect(getUnitLabels('us')).toEqual({ temp: '°F', wind: 'mph', precip: 'in' });
  });

  it('un valor desconocido (p. ej. de almacenamiento corrupto) cae en métrico', () => {
    expect(getUnitLabels('uk' as Units)).toEqual(getUnitLabels('metric'));
  });
});

describe('alertUnitLabel usa el mismo origen', () => {
  it.each<Units>(['metric', 'us'])('%s', (units) => {
    const labels = getUnitLabels(units);
    expect(alertUnitLabel('wind', units)).toBe(labels.wind);
    expect(alertUnitLabel('temp_low', units)).toBe(labels.temp);
    expect(alertUnitLabel('temp_high', units)).toBe(labels.temp);
    expect(alertUnitLabel('rain', units)).toBe('%');
  });

  it('formatAlertValue sigue formateando igual', () => {
    expect(formatAlertValue('wind', 55, 'metric')).toBe('55 km/h');
    expect(formatAlertValue('wind', 55, 'us')).toBe('34 mph');
    expect(formatAlertValue('temp_low', 3, 'us')).toBe('37°F');
  });
});
