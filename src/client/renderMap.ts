import * as PIXI from 'pixi.js';
import Map from '../common/map';

export default function display_map(stage) {
  const map = new Map('scifi-1', 'scifi');

  for (let i = 0; i < map.tileIds.length; i++) {
    let texture = PIXI.utils.TextureCache[map.tileset.imageName].clone();
    stage.addChild(display_tile(i, map.tileIds[i], texture, map));
  }
}
function display_tile(pos: number, tile_type: number, texture, map) {
  let pos_counter = 0;
  let x_pos = 0;
  let y_pos = 0;
  let tile_pos = get_tile(tile_type, texture, map.tileset);

  for (let row = 0; row < map.height; row++) {
    for (let column = 0; column < map.width; column++) {
      if (pos_counter === pos) {
        x_pos = column;
        y_pos = row;
      }
      pos_counter += 1;
    }
  }

  let x_img = map.tileset.tileWidth * tile_pos.column;
  let y_img = map.tileset.tileHeight * tile_pos.row;
  let rectangle = new PIXI.Rectangle(
    x_img,
    y_img,
    map.tileset.tileWidth,
    map.tileset.tileHeight,
  );
  texture.frame = rectangle;

  let tile = new PIXI.Sprite(texture);
  tile.x = map.tileset.tileWidth * x_pos;
  tile.y = map.tileset.tileHeight * y_pos;

  return tile;
}

function get_tile(tile_type: number, texture, tileset) {
  let type_counter = 1;
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
