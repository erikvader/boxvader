import * as PIXI from 'pixi.js';
import GameMap from '../common/gameMap';

export default function display_map(stage: PIXI.stage, map: GameMap): void {
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      const texture = PIXI.utils.TextureCache[map.tileset.imageName].clone();
      stage.addChild(display_tile(c, r, texture, map));
    }
  }
}

function display_tile(
  x_pos: number,
  y_pos: number,
  texture: PIXI.Texture,
  gameMap: GameMap,
): void {
  const tile_pos = gameMap.tileset.tilePos(gameMap.at(x_pos, y_pos).id);

  const x_img = gameMap.tileset.tileWidth * tile_pos.column;
  const y_img = gameMap.tileset.tileHeight * tile_pos.row;
  const rectangle = new PIXI.Rectangle(
    x_img,
    y_img,
    gameMap.tileset.tileWidth,
    gameMap.tileset.tileHeight,
  );
  texture.frame = rectangle;

  const scale = gameMap.tileset.scaleFactor();
  const tile = new PIXI.Sprite(texture);
  tile.x = gameMap.tileset.tileWidth * x_pos * scale;
  tile.y = gameMap.tileset.tileHeight * y_pos * scale;
  tile.scale.set(scale, scale);

  return tile;
}
