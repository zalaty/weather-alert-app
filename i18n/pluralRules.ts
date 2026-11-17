// Reglas de plural (CLDR, cardinales) para los idiomas de la app.
//
// i18next calcula el sufijo (_one/_few/_many/_other) con Intl.PluralRules. Si el motor JS no lo
// trae (Hermes no lo implementa en todas las versiones), i18next cae a una regla de reserva que
// solo conoce one/other, y en polaco "5 ostrzeżeń" saldría con la forma equivocada. Este polyfill
// mínimo, sin dependencias, solo se instala si Intl.PluralRules no existe.
//
// Simplificación consciente: no se contemplan las formas "many" de es/fr/it/pt para números de
// millones (1.000.000), que la app nunca muestra. Los tests lo comparan con el Intl.PluralRules
// real de Node para 0–200.

export type PluralCategory = 'one' | 'few' | 'many' | 'other';

type Rule = { categories: PluralCategory[]; select: (n: number) => PluralCategory };

const isInt = (n: number) => Number.isInteger(n);

const ONE_IF_EXACTLY_ONE: Rule = {
  categories: ['one', 'other'],
  select: (n) => (n === 1 ? 'one' : 'other'),
};

// pt (Brasil) y fr: 0 y 1 (también 1,5) son "one"
const ONE_IF_ZERO_OR_ONE: Rule = {
  categories: ['one', 'other'],
  select: (n) => (Math.trunc(n) === 0 || Math.trunc(n) === 1 ? 'one' : 'other'),
};

const POLISH: Rule = {
  categories: ['one', 'few', 'many', 'other'],
  select: (n) => {
    if (!isInt(n)) return 'other';
    if (n === 1) return 'one';
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return 'few';
    return 'many';
  },
};

const RULES: Record<string, Rule> = {
  en: ONE_IF_EXACTLY_ONE,
  es: ONE_IF_EXACTLY_ONE,
  de: ONE_IF_EXACTLY_ONE,
  it: ONE_IF_EXACTLY_ONE,
  tr: ONE_IF_EXACTLY_ONE,
  pt: ONE_IF_ZERO_OR_ONE,
  fr: ONE_IF_ZERO_OR_ONE,
  pl: POLISH,
};

function ruleFor(locale: string): Rule {
  return RULES[locale.split(/[-_]/)[0].toLowerCase()] ?? ONE_IF_EXACTLY_ONE;
}

export function selectPluralCategory(locale: string, n: number): PluralCategory {
  return ruleFor(locale).select(Math.abs(n));
}

class MiniPluralRules {
  private readonly locale: string;
  private readonly rule: Rule;
  constructor(locales?: string | string[]) {
    this.locale = (Array.isArray(locales) ? locales[0] : locales) ?? 'en';
    this.rule = ruleFor(this.locale);
  }
  select(n: number): PluralCategory {
    return this.rule.select(Math.abs(n));
  }
  resolvedOptions() {
    return { locale: this.locale, type: 'cardinal', pluralCategories: [...this.rule.categories] };
  }
  static supportedLocalesOf(locales: string | string[]) {
    return Array.isArray(locales) ? locales : [locales];
  }
}

export function installPluralRulesIfMissing(): void {
  const intl = (globalThis as any).Intl;
  if (!intl || typeof intl.PluralRules === 'function') return;
  intl.PluralRules = MiniPluralRules;
}
