import { Vec2 } from 'planck-js';

export type Id = number;

/**
 * User inputs at some point in time.
 */
export interface Input {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
}

/**
 * Interpolates between two vectors.
 * @param src The source/initial vector
 * @param dst The destination/final vector
 * @param delta Interpolation percentage (should be in the interval [0, 1])
 */
export function interpolate(src: Vec2, dst: Vec2, delta: number): Vec2 {
  const x = Vec2.mul(src, delta);
  const y = Vec2.mul(dst, 1 - delta);
  return Vec2.add(x, y);
}
