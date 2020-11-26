export const MOVEMENT_SPEED = 5;
export const SERVER_FPS = 60;
export const SERVER_UPS = 60;
export const CLIENT_UPS = 60;
export const CLIENT_FPS = 60;
export const PLAYER_LIMIT = 2;
export const PORT = 3000;

export const PLAYER_SPRITE = 'imgs/zombie_0.png';

/** Minimum x-coordinate of players' spawn. */
export const PLAYER_SPAWN_X_MIN = 208;
/** Maximum x-coordinate of players' spawn. */
export const PLAYER_SPAWN_X_MAX = 304;

/** Minimum y-coordinate of players' spawn. */
export const PLAYER_SPAWN_Y_MIN = 208;
/** Maximum y-coordinate of players' spawn. */
export const PLAYER_SPAWN_Y_MAX = 304;

export const PLAYER_SCALE = 0.5;

/** Radius of the players. */
export const PLAYER_RADIUS = 16;

/** Maximum and initial health of a player. */
export const PLAYER_HEALTH_MAX = 100;

/** Width of tiles. */
export const TILE_WIDTH = 32;

/** Height of tiles. */
export const TILE_HEIGHT = 32;

export const TILE_TARGET_SIZE = 64;

export const ENEMY_SPRITE = 'imgs/b_yoda.png';
export const ENEMY_SCALE = 0.01;

export const MAP_WIDTH = 512;
export const MAP_HEIGHT = 512;

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
