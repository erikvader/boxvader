export enum Directions {
  UP = 'UP',
  UP_RIGHT = 'UP_RIGHT',
  UP_LEFT = 'UP_LEFT',
  DOWN = 'DOWN',
  DOWN_RIGHT = 'DOWN_RIGHT',
  DOWN_LEFT = 'DOWN_LEFT',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  STILL = 'STILL',
}

export function directionToVelocity(dir: Directions): [number, number] {
  switch (dir) {
    case Directions.UP:
      return [0, -1];
      break;
    case Directions.UP_RIGHT:
      return [1, -1];
      break;
    case Directions.UP_LEFT:
      return [-1, -1];
      break;
    case Directions.DOWN:
      return [0, 1];
      break;
    case Directions.DOWN_RIGHT:
      return [1, 1];
      break;
    case Directions.DOWN_LEFT:
      return [-1, 1];
      break;
    case Directions.LEFT:
      return [-1, 0];
      break;
    case Directions.RIGHT:
      return [1, 0];
      break;
    case Directions.STILL:
      return [0, 0];
  }
}

export function decideDirection(
  up: boolean,
  down: boolean,
  right: boolean,
  left: boolean,
): Directions {
  if (up) {
    if (right) {
      return Directions.UP_RIGHT;
    }
    if (left) {
      return Directions.UP_LEFT;
    } else {
      return Directions.UP;
    }
  }
  if (down) {
    if (right) {
      return Directions.DOWN_RIGHT;
    }
    if (left) {
      return Directions.DOWN_LEFT;
    } else {
      return Directions.DOWN;
    }
  }
  if (right) {
    return Directions.RIGHT;
  }
  if (left) {
    return Directions.LEFT;
  }
  return Directions.STILL;
}
