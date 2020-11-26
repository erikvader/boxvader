export const SERVER_FPS = 60;
export const SERVER_UPS = 60;
export const CLIENT_UPS = 60;
export const CLIENT_FPS = 60;
export const PLAYER_LIMIT = 1;
export const PORT = 3000;

export const PLAYER_SPRITE = 'imgs/zombie_0.png';
export const ENEMY_SPRITE = 'imgs/b_yoda.png';

/** Minimum x-coordinate of players' spawn. */
export const PLAYER_SPAWN_X_MIN = 7;
/** Maximum x-coordinate of players' spawn. */
export const PLAYER_SPAWN_X_MAX = 7;

/** Minimum y-coordinate of players' spawn. */
export const PLAYER_SPAWN_Y_MIN = 7;
/** Maximum y-coordinate of players' spawn. */
export const PLAYER_SPAWN_Y_MAX = 7;

/** Maximum and initial health of a player. */
export const PLAYER_HEALTH_MAX = 100;

/**
 * How big a tile should be drawn as. This determines the final scale of the
 * game and is the only constant expressed in pixels.
 */
export const TILE_TARGET_SIZE_PIXELS = 48;

/**
 * How big a tile or square is logically. Everything else will be dependent on
 * this. The unit is in meters.
 */
export const TILE_LOGICAL_SIZE = 1;

/**
 * Turn a logical unit (meters) to its corresponding pixel size.
 */
export const LOGICAL_TO_PIXELS = (log: number): number =>
  (log * TILE_TARGET_SIZE_PIXELS) / TILE_LOGICAL_SIZE;

/**
 * How many pixels wide an enemy sprite is.
 */
export const ENEMY_SIZE = LOGICAL_TO_PIXELS(1);

/**
 * How many pixels wide a player sprite is.
 */
export const PLAYER_SIZE = LOGICAL_TO_PIXELS(1);

/**
 * How many meters an enitie's hitbox is.
 */
export const PLAYER_HITBOX_RADIUS = 0.5;
export const ENEMY_HITBOX_RADIUS = 0.5;

/**
 * Player movement speed in meters per second.
 */
export const PLAYER_MOVEMENT_SPEED = 2;

/**
 * How seldom the server broadcasts it's state to all clients. Can be an integer
 * in the range [1,∞). 1 means send every update, 2 means send every other
 * update etc.
 */
export const SERVER_BROADCAST_RATE = 2;

/**
 * An [[Input]] is considered old if it has been in the input queue for this
 * many updates without getting popped.
 */
export const INPUT_QUEUE_MAX_AGE = 3;
