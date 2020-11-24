export const MOVEMENT_SPEED = 5;
export const SERVER_FPS = 60;
export const SERVER_UPS = 60;
export const CLIENT_UPS = 60;
export const CLIENT_FPS = 60;
export const PLAYER_LIMIT = 2;
export const PORT = 3000;

export const PLAYER_SPRITE = 'imgs/zombie_0.png';
export const PLAYER_SPAWN_X = 200;
export const PLAYER_SPAWN_Y = 200;
export const PLAYER_SCALE = 0.5;

export const MAP_SIZE_X = 512;
export const MAP_SIZE_Y = 512;

// How seldom the server broadcasts it's state to all clients. Can be an integer
// in the range [1,∞). 1 means send every update, 2 means send every other
// update etc.
export const SERVER_BROADCAST_RATE = 2;
