import { Vec2 } from 'planck-js';
import seedrandom from 'seedrandom';

// NOTE: performance resides in different places in Node and browsers.
/* eslint-disable @typescript-eslint/no-var-requires */
export const performance =
  process.env.BROWSER === 'yes'
    ? window.performance
    : require('perf_hooks').performance;

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
export function randomChoice<T>(ts: T[], rng?: seedrandom.prng): T | undefined {
  if (ts.length === 0) return undefined;
  else if (ts.length === 1) return ts[0];
  else {
    const r = rng !== undefined ? rng() : Math.random();
    const index = Math.floor(r * ts.length);
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
    const elem = this.array.pop();
    if (elem === undefined) {
      throw new Error('no more elements to pop');
    }
    return elem;
  }
}

export function randomString(length: number): string {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function floatEq(f1: number, f2: number, tolerance: number): boolean {
  return Math.abs(f1 - f2) <= tolerance;
}

export function arrayEq<A, B>(
  arr1: A[],
  arr2: B[],
  comparator: (A, B) => boolean,
): boolean {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (!comparator(arr1[i], arr2[i])) return false;
  }
  return true;
}
