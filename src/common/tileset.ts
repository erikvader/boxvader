import scifi from '../../levels/vov-scifi-tileset.json';
import * as constants from './constants';

interface TilesetJson {
  image: string;
  imagewidth: number;
  imageheight: number;
  tilewidth: number;
  tileheight: number;
  columns: number;
  tiles: {
    id: number;
    objectgroup: {
      objects: { x: number; y: number; width: number; height: number }[];
    };
  }[];
}

function getJson(name: string): TilesetJson {
  // should we do a case-insensitive comparison?
  if (name === 'scifi') {
    return scifi;
  } else {
    throw new Error(`No tileset '${name}' found.`);
  }
}

/**
 * A tile in a tileset. It has an ID, a texture and is possibly non-walkable.
 */
export interface Tile {
  readonly id: number;
  readonly walkable: boolean;
}

/**
 * Tilesets have names, an image name, width and height of its tiles and an array of the actual tiles.
 */
export default class Tileset {
  public readonly name: string;
  public readonly imageName: string;
  public readonly tileSize: number;
  public readonly tiles: Tile[];
  public readonly columns: number;

  constructor(name: string) {
    const jsonTileset = getJson(name);

    const dx = jsonTileset.tilewidth;
    const dy = jsonTileset.tileheight;
    if (dx !== dy)
      throw new Error('I can only handle tilesets with square tiles');

    let texturePath = jsonTileset.image;
    const imgsIndex = texturePath.indexOf('imgs/');
    if (imgsIndex !== -1) texturePath = texturePath.substring(imgsIndex);

    const tiles: Tile[] = [];
    let currentId = 0;

    for (let y = 0; y < jsonTileset.imageheight; y += dy) {
      for (let x = 0; x < jsonTileset.imagewidth; x += dx) {
        // the tile is marked as non-walkable if it has any collisions at all
        const collision = jsonTileset.tiles
          .filter(jsonTile => jsonTile.id === currentId)
          .some(jsonTile => jsonTile.objectgroup.objects.length > 0);

        const tile = {
          id: currentId,
          walkable: !collision,
        };

        ++currentId;
        tiles.push(tile);
      }
    }

    this.name = name;
    this.imageName = texturePath;
    this.tileSize = dx;
    this.tiles = tiles;
    this.columns = jsonTileset.columns;
  }

  public scaleFactor(): number {
    return constants.MAP.TILE_TARGET_SIZE_PIXELS / this.tileSize;
  }

  public tilePos(tile_type: number): { row: number; column: number } {
    const row = Math.trunc(tile_type / this.columns);
    const column = tile_type % this.columns;
    return { row, column };
  }
}
