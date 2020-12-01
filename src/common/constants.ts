export const SERVER_FPS = 60;
export const SERVER_UPS = 60;
export const CLIENT_UPS = 60;
export const CLIENT_FPS = 60;
export const PLAYER_LIMIT = 1;
export const PORT = 3000;

export const PLAYER_SPRITE = 'imgs/zombie_0.png';
export const ENEMY_SPRITE = 'imgs/b_yoda.png';

/** Maximum and initial health of a player. */
export const PLAYER_HEALTH_MAX = 100;

/**
 * How big a tile should be drawn as. This determines the final scale of the
 * game and is the only constant expressed in pixels.
 */
export const TILE_TARGET_SIZE_PIXELS = 32;

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
 * How many meters an entities' hitbox is.
 */
export const PLAYER_HITBOX_RADIUS = 0.5;
export const ENEMY_HITBOX_RADIUS = 0.5;

/**
 * Player movement speed in meters per second.
 */
export const PLAYER_MOVEMENT_SPEED = 2;

/**
 * Enemy movement speed in meters per second.
 */
export const ENEMY_MOVEMENT_SPEED = 1;

/** Name of the tile layer that holds the tile data of a map. */
export const MAP_TILE_LAYER_LAYER_NAME = 'Map';

/** Name of the object group layer that holds spawn positions of players. */
export const MAP_PLAYER_SPAWN_LAYER_NAME = 'Player spawn';

/** Name of the object group layer that holds spawn positions of enemies. */
export const MAP_ENEMY_SPAWN_LAYER_NAME = 'Enemy spawn';

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
