import {
  DND_ADVANCE_MINUTES, LEAD_MINUTES, planAlerts, reconcileWithEpisodes, hasPlannableHours, AlertThresholds, PlannedAlert,
} from '../services/alertEngine';
import type { DoNotDisturbConfig } from '../services/alertsStorage';
import type { HourlyWeather, WeatherData } from '../services/weatherApi';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;
const THRESHOLDS: AlertThresholds = { rain: 70, wind: 40, temp_low: 5, temp_high: 35 };
const DND_NIGHT: DoNotDisturbConfig = { enabled: true, startHour: 22, endHour: 7 };

type HourPatch = Partial<Pick<HourlyWeather, 'precipProb' | 'windSpeed' | 'temp'>>;

/**
 * Dos días de previsión horaria. `day0Midnight` es la medianoche local de la UBICACIÓN como
 * instante absoluto; `patches` va indexado por hora desde ahí (0-23 hoy, 24-47 mañana).
 */
function makeData(day0Midnight: number, patches: Record<number, HourPatch> = {}, base: HourPatch = {}): WeatherData {
  const hour = (i: number): HourlyWeather => ({
    time: `${String(i % 24).padStart(2, '0')}:00:00`,
    epoch: day0Midnight + i * HOUR,
    temp: 15,
    feelsLike: 15,
    humidity: 50,
    uvIndex: 0,
    precipProb: 0,
    precipAmount: 0,
    windSpeed: 5,
    windDir: 0,
    conditions: '',
    icon: '',
    ...base,
    ...patches[i],
  });
  const day = (d: number) => ({ date: `day${d}`, hours: Array.from({ length: 24 }, (_, h) => hour(d * 24 + h)) });
  return {
    daily: [day(0), day(1)],
    hourly: day(0).hours,
    timezone: 'Europe/Madrid',
  } as unknown as WeatherData;
}

// Madrid en noviembre = UTC+1 → medianoche local del 12-nov = 23:00 UTC del 11-nov
const MADRID_MIDNIGHT = Date.UTC(2026, 10, 11, 23, 0, 0);
const madrid = (hour: number, minute = 0) => new Date(MADRID_MIDNIGHT + hour * HOUR + minute * MIN);

// El "dispositivo" de los tests está en hora de Madrid (ver jest.globalSetup.js). Si la zona no
// se hubiera aplicado, los tests de "no molestar" pasarían o fallarían por casualidad.
it('la zona horaria del dispositivo de los tests es Europe/Madrid', () => {
  expect(new Date(MADRID_MIDNIGHT).getHours()).toBe(0);
});

describe('planAlerts', () => {
  it('umbral cruzado hoy: avisa LEAD_MINUTES antes de la primera hora que lo cruza', () => {
    const data = makeData(MADRID_MIDNIGHT, { 17: { precipProb: 80 }, 18: { precipProb: 95 } });
    const plans = planAlerts(['rain'], THRESHOLDS, data, 'metric', madrid(10));

    expect(plans).toHaveLength(1); // un aviso por episodio, no uno por hora
    expect(plans[0]).toMatchObject({
      type: 'rain',
      value: 80,
      threshold: 70,
      eventAt: madrid(17).getTime(),
      eventLocalTime: '17:00:00',
      fireAt: madrid(17).getTime() - LEAD_MINUTES * MIN,
      immediate: false,
      inProgress: false,
      silenced: false,
    });
  });

  it('umbral cruzado mañana: cruza medianoche usando las horas de daily[1]', () => {
    const data = makeData(MADRID_MIDNIGHT, { 27: { windSpeed: 55 } }); // 03:00 de mañana
    const plans = planAlerts(['wind'], THRESHOLDS, data, 'metric', madrid(20));

    expect(plans).toHaveLength(1);
    expect(plans[0].eventAt).toBe(madrid(27).getTime());
    expect(plans[0].eventLocalTime).toBe('03:00:00');
    expect(plans[0].fireAt).toBe(madrid(26).getTime());
  });

  it('nada que avisar: ni horas ya pasadas, ni fuera de la ventana de 24 h, ni alertas inactivas', () => {
    const data = makeData(MADRID_MIDNIGHT, {
      8: { precipProb: 100 }, // ya pasó
      40: { precipProb: 100 }, // 16:00 de mañana: a 30 h de las 10:00
      15: { windSpeed: 90 }, // el viento no está activo
    });
    expect(planAlerts(['rain', 'temp_low', 'temp_high'], THRESHOLDS, data, 'metric', madrid(10))).toEqual([]);
  });

  it('evento inminente: si falta menos de LEAD_MINUTES, el aviso es inmediato', () => {
    const data = makeData(MADRID_MIDNIGHT, { 11: { temp: 36 } });
    const now = madrid(10, 30);
    const [plan] = planAlerts(['temp_high'], THRESHOLDS, data, 'metric', now);

    expect(plan.immediate).toBe(true);
    expect(plan.inProgress).toBe(false);
    expect(plan.fireAt).toBe(now.getTime());
  });

  it('hora en curso: cuenta como aviso inmediato', () => {
    const data = makeData(MADRID_MIDNIGHT, { 10: { temp: 3 } });
    const [plan] = planAlerts(['temp_low'], THRESHOLDS, data, 'metric', madrid(10, 20));

    expect(plan).toMatchObject({ immediate: true, inProgress: true, eventAt: madrid(10).getTime() });
  });

  describe('franja "no molestar"', () => {
    const rainFrom = (from: number, to: number) =>
      Object.fromEntries(Array.from({ length: to - from }, (_, i) => [from + i, { precipProb: 90 }]));

    it('a) la franja aún no ha empezado: adelanta el aviso a 5 min antes de su inicio (cruza medianoche)', () => {
      const data = makeData(MADRID_MIDNIGHT, rainFrom(24, 27)); // 00:00–03:00 de mañana
      const [plan] = planAlerts(['rain'], THRESHOLDS, data, 'metric', madrid(18), { doNotDisturb: DND_NIGHT });
      // el aviso caería a las 23:00, dentro de la franja que empieza a las 22:00
      expect(plan.silenced).toBe(false);
      expect(plan.fireAt).toBe(madrid(22).getTime() - DND_ADVANCE_MINUTES * MIN);
      expect(plan.immediate).toBe(false);
      // texto normal de previsión, con la hora del evento
      expect(plan.inProgress).toBe(false);
      expect(plan.eventLocalTime).toBe('00:00:00');
    });

    it('a) también con una franja diurna, y con el aviso de madrugada de una franja nocturna', () => {
      const siesta: DoNotDisturbConfig = { enabled: true, startHour: 13, endHour: 15 };
      const afternoon = makeData(MADRID_MIDNIGHT, rainFrom(15, 16));
      const [p1] = planAlerts(['rain'], THRESHOLDS, afternoon, 'metric', madrid(10), { doNotDisturb: siesta });
      expect(p1.fireAt).toBe(madrid(12, 55).getTime());

      const dawn = makeData(MADRID_MIDNIGHT, rainFrom(30, 31)); // 06:00 de mañana → aviso a las 05:00
      const [p2] = planAlerts(['rain'], THRESHOLDS, dawn, 'metric', madrid(18), { doNotDisturb: DND_NIGHT });
      expect(p2.fireAt).toBe(madrid(21, 55).getTime());
    });

    it('a) si faltan menos de 5 min para la franja, el aviso sale ya', () => {
      const data = makeData(MADRID_MIDNIGHT, rainFrom(24, 27));
      const now = madrid(21, 58);
      const [plan] = planAlerts(['rain'], THRESHOLDS, data, 'metric', now, { doNotDisturb: DND_NIGHT });
      expect(plan).toMatchObject({ fireAt: now.getTime(), immediate: true, silenced: false });
    });

    it('b) ya dentro de la franja: al final de la franja si el episodio sigue activo entonces', () => {
      const data = makeData(MADRID_MIDNIGHT, { ...rainFrom(27, 33), 31: { precipProb: 75 } }); // 03:00–09:00 de mañana
      const [plan] = planAlerts(['rain'], THRESHOLDS, data, 'metric', madrid(23, 30), { doNotDisturb: DND_NIGHT });
      expect(plan.silenced).toBe(false);
      expect(plan.fireAt).toBe(madrid(31).getTime()); // 07:00, pasada la medianoche
      expect(plan.eventAt).toBe(madrid(27).getTime());
      expect(plan.inProgress).toBe(true); // a las 07:00 ya llueve: texto de "ahora"
      expect(plan.value).toBe(75); // con el valor de esa hora
    });

    it('c) ya dentro de la franja y el episodio termina antes de que acabe: silenciado', () => {
      const data = makeData(MADRID_MIDNIGHT, rainFrom(27, 30)); // 03:00–06:00 de mañana
      const [plan] = planAlerts(['rain'], THRESHOLDS, data, 'metric', madrid(23, 30), { doNotDisturb: DND_NIGHT });
      expect(plan.silenced).toBe(true);
    });

    it('la franja se evalúa con la hora del AVISO, no con now', () => {
      const data = makeData(MADRID_MIDNIGHT, rainFrom(33, 34)); // 09:00 de mañana → aviso a las 08:00
      // now (23:00) está dentro de la franja, pero el aviso no
      const [plan] = planAlerts(['rain'], THRESHOLDS, data, 'metric', madrid(23), { doNotDisturb: DND_NIGHT });
      expect(plan.silenced).toBe(false);
      expect(plan.fireAt).toBe(madrid(32).getTime());
    });

    it('estando en la franja de hoy, un aviso que cae en la de mañana se trata como a)', () => {
      const data = makeData(MADRID_MIDNIGHT, rainFrom(24, 27)); // 00:00 de mañana → aviso a las 23:00
      const [plan] = planAlerts(['rain'], THRESHOLDS, data, 'metric', madrid(6, 30), { doNotDisturb: DND_NIGHT });
      expect(plan.fireAt).toBe(madrid(21, 55).getTime());
    });

    it('sin franja en las opciones (feedback del interruptor) no se toca nada', () => {
      const data = makeData(MADRID_MIDNIGHT, rainFrom(24, 27));
      const [plan] = planAlerts(['rain'], THRESHOLDS, data, 'metric', madrid(21));
      expect(plan).toMatchObject({ silenced: false, fireAt: madrid(23).getTime() });
    });
  });

  it('episodio = tramo continuo de horas que cruzan, tolerando huecos de hasta 2 h', () => {
    const data = makeData(MADRID_MIDNIGHT, {
      9: { precipProb: 80 }, 10: { precipProb: 80 }, // hueco de 2 h (11 y 12)
      13: { precipProb: 80 }, // hueco de 3 h (14, 15 y 16)
      17: { precipProb: 80 },
    });
    const [plan] = planAlerts(['rain'], THRESHOLDS, data, 'metric', madrid(6));
    expect(plan.eventAt).toBe(madrid(9).getTime());
    expect(plan.episodeEndAt).toBe(madrid(14).getTime());
  });

  it('unidades imperiales: compara en métrico aunque los datos vengan en °F y mph', () => {
    // 41 °F = 5 °C (cruza temp_low <= 5); 42 °F = 5,6 °C (no). 25 mph = 40,2 km/h (cruza); 24 mph = 38,6 (no)
    const base = { temp: 60, windSpeed: 10 };
    const noCross = makeData(MADRID_MIDNIGHT, { 15: { temp: 42, windSpeed: 24 } }, base);
    expect(planAlerts(['temp_low', 'wind'], THRESHOLDS, noCross, 'us', madrid(10))).toEqual([]);

    const cross = makeData(MADRID_MIDNIGHT, { 15: { temp: 41 }, 16: { windSpeed: 25 } }, base);
    const plans = planAlerts(['temp_low', 'wind'], THRESHOLDS, cross, 'us', madrid(10));
    expect(plans.map((p) => p.type)).toEqual(['temp_low', 'wind']);
    expect(plans[0].value).toBeCloseTo(5, 5);
    expect(plans[1].value).toBeCloseTo(40.2336, 3);

    // Los mismos números leídos como métrico no cruzan (25 km/h < 40)...
    expect(planAlerts(['wind'], THRESHOLDS, cross, 'metric', madrid(10))).toEqual([]);
    // ...y 60 °F no se confunde con 60 °C para temp_high (>= 35 °C)
    expect(planAlerts(['temp_high'], THRESHOLDS, cross, 'us', madrid(10))).toEqual([]);
  });

  it('zona horaria de la ubicación distinta a la del dispositivo: manda el instante absoluto', () => {
    // Ubicación: Tokio (UTC+9); dispositivo: Madrid (UTC+1). Medianoche de Tokio del 12-nov = 15:00 UTC del 11-nov
    const tokyoMidnight = Date.UTC(2026, 10, 11, 15, 0, 0);
    const data = makeData(tokyoMidnight, { 17: { precipProb: 80 } }); // 17:00 de Tokio = 09:00 de Madrid
    const now = new Date(tokyoMidnight + 10 * HOUR);

    const [plan] = planAlerts(['rain'], THRESHOLDS, data, 'metric', now);
    expect(plan.eventAt).toBe(Date.UTC(2026, 10, 12, 8, 0, 0)); // 17:00 JST = 08:00 UTC
    expect(plan.fireAt).toBe(Date.UTC(2026, 10, 12, 7, 0, 0));
    expect(plan.eventLocalTime).toBe('17:00:00'); // el texto usa la hora de la ubicación

    // Leído como hora del dispositivo, "17:00" sería otro instante (16:00 UTC): no se usa
    expect(plan.eventAt).not.toBe(new Date(2026, 10, 12, 17, 0, 0).getTime());

    // "No molestar" va en hora del DISPOSITIVO: el aviso (08:00 de Madrid) cae en una franja 07–09
    // de Madrid, aunque en Tokio sean las 16:00
    const morning: DoNotDisturbConfig = { enabled: true, startHour: 7, endHour: 9 };
    const [withDnd] = planAlerts(['rain'], THRESHOLDS, data, 'metric', now, { doNotDisturb: morning });
    expect(withDnd.fireAt).toBe(Date.UTC(2026, 10, 12, 6, 0, 0) - DND_ADVANCE_MINUTES * MIN); // 06:55 de Madrid
  });

  it('horas sin instante absoluto (snapshot antiguo): no son planificables', () => {
    const data = makeData(MADRID_MIDNIGHT, { 17: { precipProb: 80 } });
    for (const d of data.daily) for (const h of d.hours) delete h.epoch;
    expect(hasPlannableHours(data)).toBe(false);
    expect(planAlerts(['rain'], THRESHOLDS, data, 'metric', madrid(10))).toEqual([]);
  });
});

describe('reconcileWithEpisodes', () => {
  const plan = (over: Partial<PlannedAlert> = {}): PlannedAlert => ({
    type: 'rain',
    threshold: 70,
    value: 80,
    eventAt: madrid(17).getTime(),
    episodeEndAt: madrid(18).getTime(),
    eventLocalTime: '17:00:00',
    fireAt: madrid(16).getTime(),
    immediate: false,
    inProgress: false,
    silenced: false,
    ...over,
  });

  it('episodio nuevo: se programa y se registra', () => {
    const { alerts, episodes } = reconcileWithEpisodes([plan()], {}, madrid(10));
    expect(alerts).toEqual([expect.objectContaining({ fireAt: madrid(16).getTime(), immediate: false, isNewEpisode: true })]);
    expect(episodes.rain).toEqual({ eventAt: madrid(17).getTime(), endAt: madrid(18).getTime(), fireAt: madrid(16).getTime() });
  });

  it('mismo episodio ya entregado: no se repite aunque ahora sería "inmediato"', () => {
    const now = madrid(16, 30);
    const stored = { rain: { eventAt: madrid(17).getTime(), fireAt: madrid(16).getTime() } };
    const again = plan({ fireAt: now.getTime(), immediate: true });
    expect(reconcileWithEpisodes([again], stored, now).alerts).toEqual([]);
  });

  it('mismo episodio aún sin sonar: se reprograma a la MISMA hora, nunca como inmediato', () => {
    const stored = { rain: { eventAt: madrid(17).getTime(), endAt: madrid(18).getTime(), fireAt: madrid(16).getTime() } };
    // la previsión se retrasa una hora: el plan nuevo diría 17:00
    const later = plan({ eventAt: madrid(18).getTime(), episodeEndAt: madrid(19).getTime(), fireAt: madrid(17).getTime() });
    const r1 = reconcileWithEpisodes([later], stored, madrid(12));
    expect(r1.alerts).toEqual([expect.objectContaining({ fireAt: madrid(16).getTime(), immediate: false, isNewEpisode: false })]);

    // el plan nuevo sería inmediato (faltan 40 min), pero el aviso guardado aún no ha sonado
    const now = madrid(15, 50);
    const sooner = plan({ eventAt: madrid(16).getTime() + 30 * MIN, fireAt: now.getTime(), immediate: true });
    const r2 = reconcileWithEpisodes([sooner], stored, now);
    expect(r2.alerts).toEqual([expect.objectContaining({ fireAt: madrid(16).getTime(), immediate: false, isNewEpisode: false })]);
  });

  it('mismo episodio aún sin sonar que ahora empieza antes: el aviso se adelanta, sin contarlo como nuevo', () => {
    const stored = { rain: { eventAt: madrid(17).getTime(), endAt: madrid(18).getTime(), fireAt: madrid(16).getTime() } };
    const earlier = plan({ eventAt: madrid(16).getTime(), fireAt: madrid(15).getTime() });
    const { alerts, episodes } = reconcileWithEpisodes([earlier], stored, madrid(12));
    expect(alerts).toEqual([expect.objectContaining({ fireAt: madrid(15).getTime(), immediate: false, isNewEpisode: false })]);
    expect(episodes.rain).toEqual({ eventAt: madrid(16).getTime(), endAt: madrid(18).getTime(), fireAt: madrid(15).getTime() });
  });

  it('episodio distinto (más de 2 h de diferencia): es nuevo', () => {
    const stored = { rain: { eventAt: madrid(9).getTime(), fireAt: madrid(8).getTime() } };
    const { alerts } = reconcileWithEpisodes([plan()], stored, madrid(12));
    expect(alerts[0].isNewEpisode).toBe(true);
  });

  it('aviso inmediato de episodio nuevo: queda guardado como entregado ahora', () => {
    const now = madrid(16, 30);
    const { alerts, episodes } = reconcileWithEpisodes([plan({ fireAt: now.getTime(), immediate: true })], {}, now);
    expect(alerts[0]).toMatchObject({ immediate: true, isNewEpisode: true });
    expect(episodes.rain?.fireAt).toBe(now.getTime());
  });

  it('los planes silenciados por "no molestar" no se programan ni consumen el episodio', () => {
    const { alerts, episodes } = reconcileWithEpisodes([plan({ silenced: true })], {}, madrid(10));
    expect(alerts).toEqual([]);
    expect(episodes).toEqual({});
  });

  describe('de principio a fin con planAlerts', () => {
    // Simula el planificador: cada replanificación cancela lo pendiente y reprograma. Devuelve
    // cuántas notificaciones llegan a sonar de verdad.
    function simulate(steps: { at: Date; data: WeatherData }[], until: Date) {
      let episodes = {};
      let pending: number | null = null;
      let delivered = 0;
      let newEpisodes = 0;
      const flush = (t: number) => {
        if (pending != null && pending <= t) {
          delivered++;
          pending = null;
        }
      };
      for (const step of steps) {
        flush(step.at.getTime());
        pending = null; // cancelScheduledAlerts()
        const planned = planAlerts(['rain'], THRESHOLDS, step.data, 'metric', step.at);
        const result = reconcileWithEpisodes(planned, episodes, step.at);
        episodes = result.episodes;
        for (const alert of result.alerts) {
          if (alert.isNewEpisode) newEpisodes++;
          if (alert.immediate) delivered++;
          else pending = alert.fireAt;
        }
      }
      flush(until.getTime());
      return { delivered, newEpisodes };
    }

    const rain = (from: number, to: number) =>
      makeData(MADRID_MIDNIGHT, Object.fromEntries(Array.from({ length: to - from }, (_, i) => [from + i, { precipProb: 90 }])));
    const dry = makeData(MADRID_MIDNIGHT);

    it('episodio continuo: cruzado de 9:00 a 15:00, avisado a las 8:00, replanificar a las 12:30 no avisa otra vez', () => {
      const data = rain(9, 15);
      const result = simulate(
        [
          { at: madrid(7), data },
          { at: madrid(12, 30), data }, // el primer cruce es ahora la hora en curso (12:00)
          { at: madrid(14, 45), data },
        ],
        madrid(23)
      );
      expect(result).toEqual({ delivered: 1, newEpisodes: 1 });

      // y directamente sobre el motor: a las 12:30 no sale nada
      const stored = { rain: { eventAt: madrid(9).getTime(), endAt: madrid(15).getTime(), fireAt: madrid(8).getTime() } };
      const planned = planAlerts(['rain'], THRESHOLDS, data, 'metric', madrid(12, 30));
      expect(planned[0]).toMatchObject({ eventAt: madrid(12).getTime(), immediate: true });
      expect(reconcileWithEpisodes(planned, stored, madrid(12, 30)).alerts).toEqual([]);
    });

    it('un episodio posterior y separado sí avisa de nuevo', () => {
      const data = makeData(MADRID_MIDNIGHT, { 9: { precipProb: 90 }, 10: { precipProb: 90 }, 20: { precipProb: 90 } });
      const result = simulate([{ at: madrid(7), data }, { at: madrid(12), data }], madrid(23));
      expect(result).toEqual({ delivered: 2, newEpisodes: 2 });
    });

    it('previsión inestable: aparece, desaparece y reaparece ±2 h antes de sonar → un solo aviso', () => {
      const result = simulate(
        [
          { at: madrid(10), data: rain(17, 19) }, // programado para las 16:00
          { at: madrid(11), data: dry }, // se retira
          { at: madrid(12), data: rain(18, 20) }, // reaparece una hora más tarde
        ],
        madrid(23)
      );
      expect(result).toEqual({ delivered: 1, newEpisodes: 1 });
    });

    it('previsión inestable: reaparece cuando la hora de aviso original ya pasó → sigue saliendo un aviso, y solo uno', () => {
      const result = simulate(
        [
          { at: madrid(10), data: rain(17, 19) },
          { at: madrid(15, 30), data: dry }, // retirado antes de sonar (16:00)
          { at: madrid(16, 20), data: rain(17, 19) }, // reaparece con menos de 60 min: inmediato
          { at: madrid(16, 40), data: rain(17, 19) },
          { at: madrid(17, 30), data: rain(17, 19) },
        ],
        madrid(23)
      );
      expect(result).toEqual({ delivered: 1, newEpisodes: 1 });
    });

    it('previsión inestable: ya avisado, desaparece y reaparece → no se repite', () => {
      const result = simulate(
        [
          { at: madrid(10), data: rain(17, 19) },
          { at: madrid(16, 10), data: dry }, // el aviso sonó a las 16:00
          { at: madrid(16, 30), data: rain(18, 20) },
        ],
        madrid(23)
      );
      expect(result).toEqual({ delivered: 1, newEpisodes: 1 });
    });
  });
});
