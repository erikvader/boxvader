import { NumMap, isObjectWithKeys } from './misc';

/**
 * Some datastructure that can pop/push values from the beginning/end. Each
 * value is added unto some kind of timeline kinda, annoying to explain.
 * @typeParam T Is the type this thing stores.
 */
export default class Deque<T> {
  private _first: number;
  private _last: number | null;
  private data: NumMap<T>;

  /**
   * Create an empty Deque
   * @param ind The start number in the timeline, default as 0
   */
  constructor();
  constructor(ind: number) {
    this.data = {};
    this._last = null;
    this._first = ind === undefined ? 0 : ind;
    this._first -= 1; // NOTE: compensate for `push_end`
  }

  /**
   * @returns the number of elements in this thing
   */
  public get length(): number {
    if (this._last === null) {
      return 0;
    }
    return this._last - this._first + 1;
  }

  /**
   * @returns Where the first value is stored. If the deque is empty, then this
   * is the last place a value was stored at.
   */
  public get first(): number {
    return this._first;
  }

  /**
   * @returns Where the last value is stored. If the deque is empty, then this
   * is the last place a value was stored at.
   */
  public get last(): number {
    return this._last ?? this.first;
  }

  /**
   * @returns The first element, if any.
   */
  public first_ele(): T | undefined {
    if (this.length === 0) {
      return undefined;
    }
    return this._data[this._first];
  }

  /**
   * @returns The last element, if any.
   */
  public last_ele(): T | undefined {
    if (this.length === 0) {
      return undefined;
    }
    return this._data[this._last];
  }

  /**
   * Adds an element at the end.
   * @param ele The element to add
   */
  public push_end(ele: T): void {
    if (this.length === 0) {
      this._first += 1;
      this._last = this._first;
    } else {
      this._last += 1;
    }
    this.data[this._last] = ele;
  }

  /**
   * Pops an element from the end. Throws an error if the deque is empty.
   * @returns The popped element.
   */
  public pop_end(): T {
    if (this.length <= 0) {
      throw new Error('nothing to pop, I am empty');
    }

    const x = this.data[this._last];
    delete this.data[this._last];
    this._last -= 1;
    if (this._last < this._first) {
      this._last = null;
    }
    return x;
  }

  /**
   * Pops an element from the beginning. Throws an error if the deque is empty.
   * @returns The popped element.
   */
  public pop_beg(): T {
    if (this.length <= 0) {
      throw new Error('nothing to pop, I am empty');
    }

    const x = this.data[this._first];
    delete this.data[this._first];
    this._first += 1;
    if (this._first > this._last) {
      this._first -= 1;
      this._last = null;
    }
    return x;
  }

  /**
   * @returns The values of this deque in an [[Array]].
   */
  public toArray(): T[] {
    const res = [];
    if (this.length > 0) {
      for (let i = this._first; i <= this._last; i++) {
        res.push(this.data[i]);
      }
    }
    return res;
  }

  /**
   * Discard elements from the beginning until the value at time `x` (inclusive)
   * is dropped.
   * @param x The time to pop to.
   * @returns The element at `x` if the list is non-empty.
   */
  public discard_beg_until(x: number): T | undefined {
    let ret = undefined;
    while (this._last !== null && x >= this._first) {
      ret = this.pop_beg();
    }
    return ret;
  }

  /**
   * Adds the newer elements of `other` into ourselves if no gaps are formed.
   * @returns true if something new was added.
   */
  public merge_end(readonly other: Deque): bool {
    if (other.length === 0) {
      return false;
    }

    if (
      // they are directly next to each other
      other._first === this.last + 1 ||
      // `other` has newer values, and no gap!
      (other.last > this.last && other._first <= this.last + 1)
    ) {
      for (let i = this.last + 1; i <= other.last; i++) {
        this.data[i] = other.data[i];
      }
      this._last = other._last;
      return true;
    }

    return false;
  }

  /**
   * Reconstruct a deque from a `JSON.parse` or similar.
   * @param obj A object with the same instance variables as [[Deque]] (even
   * private).
   * @param reviver A function that revives all child elements.
   * @typeParam R The type the revived Deque will contain.
   */
  public static revive<R>(obj: unknown, reviver: (unknown) => R): Deque<R> {
    if (isObjectWithKeys(obj, ['_first', '_last', 'data'])) {
      const x = new Deque();
      x._first = obj['_first'];
      x._last = obj['_last'];
      for (const k in obj['data']) {
        x.data[k] = reviver(obj['data'][k]);
      }
      return x;
    }
    throw new Error("couldn't revive Deque");
  }
}
