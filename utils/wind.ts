export function getWindDirection(degrees: number, dirs: string[]): string {
  return dirs[Math.round(degrees / 45) % 8];
}
