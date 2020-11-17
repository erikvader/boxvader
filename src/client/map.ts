import SpriteUtilities from './spriteUtilities.js';
import Tileset, { Tile } from './tileset';
import scifi_1 from '../../levels/vov-scifi-1.json';

interface MapJson {
  width: number;
  height: number;
  layers: { data: number[] }[];
}

function getJson(name: string): MapJson {
  // should we do a case-insensitive comparison?
  if (name === 'scifi-1') {
    return scifi_1;
  } else {
    throw new Error(`No map '${name}' found.`);
  }
}

export default class Map {
  public readonly name: string;
  public readonly width: number; // width in number of tiles
  public readonly height: number; // height in number of tiles
  public readonly tileset: Tileset;
  public readonly tileIds: number[];

  public get tiles(): Tile[] {
    return this.tileIds.map(id => this.tileset.tiles[id]);
  }

  constructor(name: string, tilesetName: string, su: SpriteUtilities) {
    const jsonMap = getJson(name);
    const tileset = new Tileset(tilesetName, su);

    const numLayers = jsonMap.layers.length;
    if (numLayers !== 1) {
      throw new Error(`Expected 1 layer in map '${name}', found ${numLayers}`);
    }

    const tileIds = jsonMap.layers[0].data;
    const tilesetLength = tileset.tiles.length;

    if (tileIds.some(id => id >= tilesetLength)) {
      throw new Error(
        `Tileset '${tileset.name}' is not large enough for map '${name}'.`,
      );
    }

    this.name = name;
    this.width = jsonMap.width;
    this.height = jsonMap.height;
    this.tileset = tileset;
    this.tileIds = jsonMap.layers[0].data;
  }
}
