import { installPluralRulesIfMissing, selectPluralCategory } from '../i18n/pluralRules';

// Locales tal como los ve i18next (SUPPORTED_LANGUAGES)
const LOCALES = ['es', 'es-419', 'en', 'pt-BR', 'fr', 'de', 'it', 'pl', 'tr'];

describe('selectPluralCategory coincide con el Intl.PluralRules real (Node, CLDR)', () => {
  it.each(LOCALES)('%s, de 0 a 200', (locale) => {
    const native = new Intl.PluralRules(locale);
    for (let n = 0; n <= 200; n++) {
      expect([n, selectPluralCategory(locale, n)]).toEqual([n, native.select(n)]);
    }
  });

  it.each(LOCALES)('%s, decimales', (locale) => {
    const native = new Intl.PluralRules(locale);
    for (const n of [0.5, 1.5, 2.5, 5.5]) {
      expect([n, selectPluralCategory(locale, n)]).toEqual([n, native.select(n)]);
    }
  });
});

describe('polaco: las cuatro formas', () => {
  it.each([
    [1, 'one'],
    [2, 'few'], [3, 'few'], [4, 'few'], [22, 'few'], [104, 'few'],
    [0, 'many'], [5, 'many'], [11, 'many'], [12, 'many'], [14, 'many'], [25, 'many'], [112, 'many'],
    [1.5, 'other'],
  ])('%s → %s', (n, expected) => {
    expect(selectPluralCategory('pl', n as number)).toBe(expected);
  });
});

describe('installPluralRulesIfMissing', () => {
  const original = Intl.PluralRules;
  afterEach(() => {
    (Intl as any).PluralRules = original;
  });

  it('no sustituye un Intl.PluralRules nativo', () => {
    installPluralRulesIfMissing();
    expect(Intl.PluralRules).toBe(original);
  });

  it('si falta, instala uno con la API que usa i18next', () => {
    delete (Intl as any).PluralRules;
    installPluralRulesIfMissing();
    const rule = new Intl.PluralRules('pl', { type: 'cardinal' });
    expect(rule.select(3)).toBe('few');
    expect(rule.resolvedOptions().pluralCategories).toEqual(['one', 'few', 'many', 'other']);
  });
});
