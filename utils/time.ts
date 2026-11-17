/** "08:03:59" → "08:03". Vacío → "--". Para amanecer/atardecer (hora local de la ubicación). */
export function formatSunTime(timeStr: string | undefined): string {
  return timeStr ? timeStr.substring(0, 5) : '--';
}
