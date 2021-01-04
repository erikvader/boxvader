/**
 * Takes a function `func` and converts it to version that is called `ms`
 * milliseconds later. The return value of `func` is discarded. If `ms` is 0
 * then `func` is simply returned, so there will be no function call overhead
 * if a delay is not desired.
 * @param ms how long to delay by in milliseconds
 * @param func the function to delay
 * @returns a function that will, when executed, call `func` with all passed
 * parameters after `ms` milliseconds.
 */
export function delay(
  ms: number,
  func: (...args) => unknown,
): (...args) => void {
  if (ms <= 0) {
    return func;
  }

  return function(this: unknown, ...args): void {
    setTimeout(() => func.apply(this, args), ms);
  };
}

/**
 * Takes a function `func` and converts it to version that randomly is not run.
 * @param drop_chance a number between 0 and 1, the chance that `func` is not run.
 * @param func the function to drop
 * @returns a function that will, when executed, call `func` with all passed
 * parameters, sometimes.
 */
export function drop<T>(
  drop_chance: number,
  func: (...args) => T,
): (...args) => T | undefined {
  if (drop_chance === 0) {
    return func;
  }

  return function(this: unknown, ...args) {
    if (Math.random() > drop_chance) return func.apply(this, args);
    return undefined;
  };
}
