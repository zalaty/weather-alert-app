import { formatAppVersion } from '../utils/appVersion';
import { formatSunTime } from '../utils/time';

describe('formatAppVersion', () => {
  it('build real: versión y número de build', () => {
    expect(formatAppVersion({ isExpoGo: false, nativeVersion: '1.4.1', nativeBuild: '28', configVersion: '1.4.1' }))
      .toBe('1.4.1 (28)');
  });

  it('Expo Go: solo la versión de app.json, nunca la de Expo Go', () => {
    expect(formatAppVersion({ isExpoGo: true, nativeVersion: '54.0.2', nativeBuild: '1017', configVersion: '1.4.1' }))
      .toBe('1.4.1');
  });

  it('sin número de build: solo la versión', () => {
    expect(formatAppVersion({ isExpoGo: false, nativeVersion: '1.4.1', nativeBuild: null, configVersion: '1.4.1' }))
      .toBe('1.4.1');
  });

  it('sin versión nativa (web): la de app.json', () => {
    expect(formatAppVersion({ isExpoGo: false, nativeVersion: null, nativeBuild: null, configVersion: '1.4.1' }))
      .toBe('1.4.1');
  });
});

describe('formatSunTime', () => {
  it('quita los segundos', () => {
    expect(formatSunTime('08:03:59')).toBe('08:03');
  });

  it('ya en HH:MM se queda igual', () => {
    expect(formatSunTime('18:45')).toBe('18:45');
  });

  it('vacío o ausente: --', () => {
    expect(formatSunTime('')).toBe('--');
    expect(formatSunTime(undefined)).toBe('--');
  });
});
