import * as PIXI from 'pixi.js';
import GameMap from '../common/gameMap';
import Tileset from '../common/tileset';

export default function display_gameMap(stage: PIXI.stage): void {
  const gameMap = new GameMap('scifi-1', 'scifi');
  for (let i = 0; i < gameMap.tileIds.length; i++) {
    const texture = PIXI.utils.TextureCache[gameMap.tileset.imageName].clone();
    stage.addChild(display_tile(i, gameMap.tileIds[i], texture, gameMap));
  }
}
function display_tile(
  pos: number,
  tile_type: number,
  texture: PIXI.Texture,
  gameMap: GameMap,
): void {
  let pos_counter = 0;
  let x_pos = 0;
  let y_pos = 0;
  const tile_pos = get_tile(tile_type, texture, gameMap.tileset);

  for (let row = 0; row < gameMap.height; row++) {
    for (let column = 0; column < gameMap.width; column++) {
      if (pos_counter === pos) {
        x_pos = column;
        y_pos = row;
      }
      pos_counter += 1;
    }
  }

  const x_img = gameMap.tileset.tileWidth * tile_pos.column;
  const y_img = gameMap.tileset.tileHeight * tile_pos.row;
  const rectangle = new PIXI.Rectangle(
    x_img,
    y_img,
    gameMap.tileset.tileWidth,
    gameMap.tileset.tileHeight,
  );
  texture.frame = rectangle;

  const tile = new PIXI.Sprite(texture);
  tile.x = gameMap.tileset.tileWidth * x_pos;
  tile.y = gameMap.tileset.tileHeight * y_pos;

  return tile;
}

function get_tile(
  tile_type: number,
  texture: PIXI.Texture,
  tileset: Tileset,
): { row: number; column: number } {
  let type_counter = 0;
  for (let row = 0; row < texture.height / tileset.tileHeight; row++) {
    for (let column = 0; column < texture.width / tileset.tileWidth; column++) {
      if (tile_type === type_counter) {
        return {
          row: row,
          column: column,
        };
      }

      type_counter += 1;
    }
  }
  return {
    row: 0,
    column: 0,
  };
}
