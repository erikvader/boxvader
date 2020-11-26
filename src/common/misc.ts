import { Region } from './map';
import { Vec2 } from 'planck-js';

export type Id = number;

export interface NumMap<T> {
  [num: number]: T;
}

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
  const x = Vec2.mul(src, 1 - delta);
  const y = Vec2.mul(dst, delta);
  return Vec2.add(x, y);
}

export function reviveVec2(obj: unknown): Vec2 {
  if (isObjectWithKeys(obj, ['x', 'y'])) {
    return new Vec2(obj['x'], obj['y']);
  }
  throw new Error("can't revive Vec2");
}

export function isObjectWithKeys(
  obj: unknown,
  keys: Array<string>,
): obj is NonNullable<Record<string, any>> {
  if (typeof obj === 'object' && obj !== null) {
    for (const k of keys) {
      if (!(k in obj)) return false;
    }
    return true;
  }
  return false;
}

/** Select a random element from an array. Returns `undefined` if the array is empty. */
export function randomChoice<T>(ts: T[]): T | undefined {
  if (ts.length === 0) return undefined;
  else if (ts.length === 1) return ts[0];
  else {
    const index = Math.floor(Math.random() * (ts.length + 1));
    return ts[index];
  }
}

/** Generate a random point inside a map region. */
export function randomPoint(region: Region): Vec2 {
  return new Vec2(
    region.x + Math.random() * region.width,
    region.y + Math.random() * region.height,
  );
}
