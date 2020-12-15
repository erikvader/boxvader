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
 * Compresses an `Input` to a single whole number.
 */
export function compactInput(inp: Input): number {
  return (
    1 * (inp.up ? 1 : 0) +
    2 * (inp.down ? 1 : 0) +
    4 * (inp.left ? 1 : 0) +
    8 * (inp.right ? 1 : 0) +
    16 * (inp.fire ? 1 : 0)
  );
}

/**
 * Creates a `Input` from a whole number.
 */
export function explodeInput(comp: number): Input {
  return {
    up: (comp & 1) > 0,
    down: (comp & 2) > 0,
    left: (comp & 4) > 0,
    right: (comp & 8) > 0,
    fire: (comp & 16) > 0,
  };
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
    const index = Math.floor(Math.random() * ts.length);
    return ts[index];
  }
}

/**
 * A wrapper around [[Array]] whose pop throws an error instead of returning
 * undefined when the array is empty.
 */
export class PopArray<T = number> {
  public array: T[];

  constructor(array: T[]) {
    this.array = array;
  }

  public pop(): T {
    const ele = this.array.pop();
    if (ele === undefined) {
      throw new Error('no more elements to pop');
    }
    return ele;
  }
}
