/** Server constants. */
export const SERVER = {
  /** Number of server updates per second. */
  UPS: 60,

  /** Number of server frames per second. */
  FPS: 60,

  /** Server port. */
  PORT: 3000,

  /**
   * How seldom the server broadcasts its state to all clients. Can be an integer
   * in the range [1,∞). 1 means send every update, 2 means send every other
   * update etc.
   */
  BROADCAST_RATE: 2,

  /** Maximum number of players per lobby. */
  PLAYER_LIMIT: 6,

  /**
   * An [[Input]] is considered old if it has been in the input queue for this
   * many updates without getting popped.
   */
  INPUT_QUEUE_MAX_AGE: 3,
};

/** Client constants. */
export const CLIENT = {
  /** Number of client updates per second. */
  UPS: 60,

  /** Number of client frames per second. */
  FPS: 60,

  /** Maximum number of inputs to send to the server at a time. */
  MAX_INPUTS: 20,
};

/** Game constants. */
export const GAME = {
  /** Maximum and initial health of a player. */
  PLAYER_HEALTH_MAX: 5,

  /** Player hitbox radius (meters). */
  PLAYER_HITBOX_RADIUS: 0.5,

  /** Enemy hitbox radius (meters) */
  ENEMY_HITBOX_RADIUS: 0.5,

  /**  Player movement speed in meters per second. */
  PLAYER_MOVEMENT_SPEED: 2,

  /** Enemy movement speed in meters per second. */
  ENEMY_MOVEMENT_SPEED: 1,

  /** Duration (in seconds) of invulnearability for players. */
  PLAYER_INVULNERABILITY_TIME: 0.5,

  /** The increment in enemy health for each wave. */
  WAVE_ENEMY_HEALTH_INCREMENT: 2,

  /** Delay (in seconds) between enemy spawns in a wave. */
  WAVE_SPAWN_DELAY: 0.5,

  /** Delay (in seconds) between waves. */
  WAVE_COOLDOWN: 3,
};

/** Map and tile constants. */
export const MAP = {
  /**
   * How big a tile should be drawn as. This determines the final scale of the
   * game and is the only constant expressed in pixels.
   */
  TILE_TARGET_SIZE_PIXELS: 48,

  /**
   * How big a tile or square is logically. Everything else will be dependent on
   * this. The unit is in meters.
   */
  TILE_LOGICAL_SIZE: 1,

  /** Turn a logical unit (meters) to its corresponding pixel size. */
  LOGICAL_TO_PIXELS: (logical: number): number =>
    (logical * MAP.TILE_TARGET_SIZE_PIXELS) / MAP.TILE_LOGICAL_SIZE,

  /** Name of the tile layer that holds the tile data of a map. */
  TILE_LAYER_LAYER_NAME: 'Map',

  /** Name of the object group layer that holds spawn positions of players. */
  PLAYER_SPAWN_LAYER_NAME: 'Player spawn',

  /** Name of the object group layer that holds spawn positions of enemies. */
  ENEMY_SPAWN_LAYER_NAME: 'Enemy spawn',
};

/** UI constants. */
export const UI = {
  /** Spritesheet for players. */
  PLAYER_SPRITE_PATH: 'imgs/zombie_0.png',

  /** Spritesheet for enemies. */
  ENEMY_SPRITE_PATH: 'imgs/b_yoda.png',

  /** How many pixels wide an enemy sprite is. */
  ENEMY_SIZE: MAP.LOGICAL_TO_PIXELS(1),

  /** How many pixels wide a player sprite is. */
  PLAYER_SIZE: MAP.LOGICAL_TO_PIXELS(1),

  /** How many pixels wide a hp bar is. */
  HP_BAR_WIDTH: 30,

  /** How many pixels high a hp bar is. */
  HP_BAR_HEIGHT: 5,

  /** How many pixels an hp bar is. */
  HP_BAR_FLOAT: 30,
};
