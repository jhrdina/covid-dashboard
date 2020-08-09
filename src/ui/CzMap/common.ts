import { interpolateOrRd } from 'd3-scale-chromatic';

export const SHAPE_KEYS: Record<string, string> = {
  path: 'd',
  polygon: 'points',
  polyline: 'points',
};

export const projectValueSqrt = (
  currentValue: number,
  min: number,
  max: number
) =>
  Math.sqrt(Math.min(Math.max(currentValue, min), max)) / Math.sqrt(max || 1);

export const valueToColor = (value: number, max: number) =>
  interpolateOrRd(projectValueSqrt(value, 0, max));
