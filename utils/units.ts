export type Units = 'metric' | 'us';

export interface UnitLabels {
  /** "°C" / "°F" */
  temp: string;
  /** "km/h" / "mph" */
  wind: string;
  /** "mm" / "in" */
  precip: string;
}

// Único origen de las etiquetas de unidad de la app. Los datos llegan de Visual Crossing ya en
// el sistema pedido (unitGroup=metric|us), así que aquí solo se etiquetan, no se convierten.
const UNIT_LABELS: Record<Units, UnitLabels> = {
  metric: { temp: '°C', wind: 'km/h', precip: 'mm' },
  us: { temp: '°F', wind: 'mph', precip: 'in' },
};

export function getUnitLabels(units: Units): UnitLabels {
  return UNIT_LABELS[units] ?? UNIT_LABELS.metric;
}
