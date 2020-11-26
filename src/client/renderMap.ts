import * as PIXI from 'pixi.js';
import Map from '../common/map';

export default function display_map(stage: PIXI.stage, map: Map): void {
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
  map: Map,
): void {
  const tile_pos = map.tileset.tilePos(map.at(x_pos, y_pos).id);

  const x_img = map.tileset.tileWidth * tile_pos.column;
  const y_img = map.tileset.tileHeight * tile_pos.row;
  const rectangle = new PIXI.Rectangle(
    x_img,
    y_img,
    map.tileset.tileWidth,
    map.tileset.tileHeight,
  );
  texture.frame = rectangle;

  const scale = map.tileset.scaleFactor();
  const tile = new PIXI.Sprite(texture);
  tile.x = map.tileset.tileWidth * x_pos * scale;
  tile.y = map.tileset.tileHeight * y_pos * scale;
  tile.scale.set(scale, scale);

  return tile;
}
