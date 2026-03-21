/**
 * Opacity for the manual brightness dim overlay (0 = none).
 */
export function getDimOverlayOpacity(
  brightness: number,
  autoBrightness: boolean,
): number {
  if (autoBrightness) {
    return 0;
  }
  if (brightness >= 100) {
    return 0;
  }
  return ((100 - brightness) / 100) * 0.5;
}
