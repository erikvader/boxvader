// ------------------
// ----- SERVER -----
// ------------------

/** Number of server updates per second. */
export const SERVER_UPS = 60;

/** Number of server frames per second. */
export const SERVER_FPS = 60;

/** Server port. */
export const SERVER_PORT = 3000;

/**
 * How seldom the server broadcasts its state to all clients. Can be an integer
 * in the range [1,∞). 1 means send every update, 2 means send every other
 * update etc.
 */
export const SERVER_BROADCAST_RATE = 2;

/** Maximum number of players per lobby. */
export const SERVER_PLAYER_LIMIT = 1;

/**
 * An [[Input]] is considered old if it has been in the input queue for this
 * many updates without getting popped.
 */
export const SERVER_INPUT_QUEUE_MAX_AGE = 3;

// ------------------
// ----- CLIENT -----
// ------------------

/** Number of client updates per second. */
export const CLIENT_UPS = 60;

/** Number of client frames per second. */
export const CLIENT_FPS = 60;

// ----------------
// ----- GAME -----
// ----------------

/** Maximum and initial health of a player. */
export const GAME_PLAYER_HEALTH_MAX = 5;

/** Player hitbox radius (meters). */
export const GAME_PLAYER_HITBOX_RADIUS = 0.5;

/** Enemy hitbox radius (meters) */
export const GAME_ENEMY_HITBOX_RADIUS = 0.5;

/**  Player movement speed in meters per second. */
export const GAME_PLAYER_MOVEMENT_SPEED = 2;

/** Enemy movement speed in meters per second. */
export const GAME_ENEMY_MOVEMENT_SPEED = 1;

/** The increment in enemy health for each wave. */
export const GAME_WAVE_ENEMY_HEALTH_INCREMENT = 2;

/** Delay (in seconds) between enemy spawns in a wave. */
export const GAME_WAVE_SPAWN_DELAY = 0.5;

/** Delay (in seconds) between waves. */
export const GAME_WAVE_COOLDOWN = 3;

// --------------------
// ----- MAP/TILE -----
// --------------------

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

/** Name of the object group layer that holds spawn positions of enemies. */

/** Turn a logical unit (meters) to its corresponding pixel size. */
export const LOGICAL_TO_PIXELS = (logical: number): number =>
  (logical * TILE_TARGET_SIZE_PIXELS) / TILE_LOGICAL_SIZE;

/** Name of the tile layer that holds the tile data of a map. */
export const MAP_TILE_LAYER_LAYER_NAME = 'Map';

/** Name of the object group layer that holds spawn positions of players. */
export const MAP_PLAYER_SPAWN_LAYER_NAME = 'Player spawn';

/** Name of the object group layer that holds spawn positions of enemies. */
export const MAP_ENEMY_SPAWN_LAYER_NAME = 'Enemy spawn';

// --------------
// ----- UI -----
// --------------

/** Spritesheet for players. */
export const UI_PLAYER_SPRITE_PATH = 'imgs/zombie_0.png';

/** Spritesheet for enemies. */
export const UI_ENEMY_SPRITE_PATH = 'imgs/b_yoda.png';

/** How many pixels wide an enemy sprite is. */
export const UI_ENEMY_SIZE = LOGICAL_TO_PIXELS(1);

/** How many pixels wide a player sprite is. */
export const UI_PLAYER_SIZE = LOGICAL_TO_PIXELS(1);

/** How many pixels wide a hp bar is. */
export const UI_HP_BAR_WIDTH = 30;

/** How many pixels high a hp bar is. */
export const UI_HP_BAR_HEIGHT = 5;

/** How many pixels an hp bar is. */
export const UI_HP_BAR_FLOAT = 30;
