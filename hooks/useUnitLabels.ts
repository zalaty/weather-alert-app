import { useWeatherStore } from '../store/weatherStore';
import { getUnitLabels, UnitLabels } from '../utils/units';

/** Etiquetas de unidad ({ temp, wind, precip }) según la preferencia del usuario */
export function useUnitLabels(): UnitLabels {
  const units = useWeatherStore((s) => s.units);
  return getUnitLabels(units);
}
