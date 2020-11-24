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
  public floydWarshallMatrix: number[][];

  public get tiles(): Tile[] {
    return this.tileIds.map(id => this.tileset.tiles[id]);
  }

  constructor(name: string, tilesetName: string) {
    const jsonMap = getJson(name);
    const tileset = new Tileset(tilesetName);
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

    this.floydWarshallMatrix = [[]];

    this.floydWarshallAlgorithm();
  }
  // nw = -17, n = -16, ne = -15, v = -1, e = 1, sw = 15, s = 16, se = 17
  private floydWarshallAlgorithm() {
    const tiles = this.tiles;

    for (let i = 0; i < this.width * this.height; i++) {
      this.floydWarshallMatrix[i] = [];
      for (let j = 0; j < this.height * this.width; j++)
        this.floydWarshallMatrix[i][j] = Infinity;
    }
    for (let i = 0; i < this.width * this.height; i++) {
      this.floydWarshallMatrix[i][i] = 0;
      if (this.tiles[i].walkable) {
        if (i - 16 >= 0 && this.tiles[i - 16].walkable) {
          //checks north
          this.floydWarshallMatrix[i][i - 16] = 1;
        }
        if (i + 16 <= this.width * this.height && this.tiles[i + 16].walkable) {
          //checks south
          this.floydWarshallMatrix[i][i + 16] = 1;
        }
        if (
          i - (1 % this.width) !== this.width - 1 &&
          this.tiles[i - 1].walkable
        ) {
          //checks west
          this.floydWarshallMatrix[i][i - 1] = 1;
        }
        if (i + (1 % this.width) !== 0 && this.tiles[i + 1].walkable) {
          //checks east
          this.floydWarshallMatrix[i][i + 1] = 1;
        }
      }
    }
    console.log(this.floydWarshallMatrix);
  }

  public at(x: number, y: number): Tile {
    const index = y * this.width + x;
    return this.tiles[index];
  }
}
