import * as PIXI from 'pixi.js';
import Map from '../common/map';
import Tileset from '../common/tileset';

export default function display_map(stage: PIXI.stage) {
  const map = new Map('scifi-1', 'scifi');
  for (let i = 0; i < map.tileIds.length; i++) {
    const texture = PIXI.utils.TextureCache[map.tileset.imageName].clone();
    stage.addChild(display_tile(i, map.tileIds[i], texture, map));
  }
}
function display_tile(
  pos: number,
  tile_type: number,
  texture: PIXI.Texture,
  map: Map,
) {
  let pos_counter = 0;
  let x_pos = 0;
  let y_pos = 0;
  const tile_pos = get_tile(tile_type, texture, map.tileset);

  for (let row = 0; row < map.height; row++) {
    for (let column = 0; column < map.width; column++) {
      if (pos_counter === pos) {
        x_pos = column;
        y_pos = row;
      }
      pos_counter += 1;
    }
  }

  const x_img = map.tileset.tileWidth * tile_pos.column;
  const y_img = map.tileset.tileHeight * tile_pos.row;
  const rectangle = new PIXI.Rectangle(
    x_img,
    y_img,
    map.tileset.tileWidth,
    map.tileset.tileHeight,
  );
  texture.frame = rectangle;

  const tile = new PIXI.Sprite(texture);
  tile.x = map.tileset.tileWidth * x_pos;
  tile.y = map.tileset.tileHeight * y_pos;

  return tile;
}

function get_tile(tile_type: number, texture: PIXI.Texture, tileset: Tileset) {
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
