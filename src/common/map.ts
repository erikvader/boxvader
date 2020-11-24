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
    this.tileIds = jsonMap.layers[0].data.map(id => id - 1);
    this.floydWarshallMatrix = [[]];

    this.floydWarshallAlgorithm();
  }

  private floydWarshallAlgorithm() {
    const tiles = this.tiles;
    const floydWarshallWeight: number[][] = [[]];

    for (let i = 0; i < this.width * this.height; i++) {
      floydWarshallWeight[i] = [];
      this.floydWarshallMatrix[i] = [];
      for (let j = 0; j < this.height * this.width; j++) {
        floydWarshallWeight[i][j] = Infinity;
        if (this.tiles[j].walkable) {
          this.floydWarshallMatrix[i][j] = j;
        } else {
          this.floydWarshallMatrix[i][j] = NaN;
        }
      }
    }
    for (let i = 0; i < this.width * this.height; i++) {
      floydWarshallWeight[i][i] = 0;
      this.floydWarshallMatrix[i][i] = i;
      if (this.tiles[i].walkable) {
        //checks north
        if (i - 16 >= 0 && this.tiles[i - 16].walkable) {
          floydWarshallWeight[i][i - 16] = 1;
        }
        //checks south
        if (i + 16 <= this.width * this.height && this.tiles[i + 16].walkable) {
          floydWarshallWeight[i][i + 16] = 1;
        }
        //checks west
        if (
          (i - 1) % this.width !== this.width - 1 &&
          this.tiles[i - 1].walkable
        ) {
          floydWarshallWeight[i][i - 1] = 1;
        }
        //checks east
        if ((i + 1) % this.width !== 0 && this.tiles[i + 1].walkable) {
          floydWarshallWeight[i][i + 1] = 1;
        }
        //checks northeast
        if (
          (i - 17) % this.width !== this.width - 1 &&
          i - 17 >= 0 &&
          this.tiles[i - 17].walkable
        ) {
          floydWarshallWeight[i][i - 17] = Math.sqrt(2);
        }
        //checks northwest
        if (
          (i - 15) % this.width !== 0 &&
          i - 15 >= 0 &&
          this.tiles[i - 15].walkable
        ) {
          floydWarshallWeight[i][i - 15] = Math.sqrt(2);
        }
        //checks southeast
        if (
          (i + 17) % this.width !== this.width - 1 &&
          i + 17 <= this.width * this.height &&
          this.tiles[i + 17].walkable
        ) {
          floydWarshallWeight[i][i + 17] = Math.sqrt(2);
        }
        //checks southwest
        if (
          (i + 15) % this.width !== 0 &&
          i + 15 <= this.width * this.height &&
          this.tiles[i + 15].walkable
        ) {
          floydWarshallWeight[i][i + 15] = Math.sqrt(2);
        }
      }
    }
    for (let k = 0; k < this.width * this.height; k++) {
      for (let j = 0; j < this.width * this.height; j++) {
        for (let i = 0; i < this.width * this.height; i++) {
          if (
            floydWarshallWeight[i][j] >
            floydWarshallWeight[i][k] + floydWarshallWeight[k][j]
          ) {
            floydWarshallWeight[i][j] =
              floydWarshallWeight[i][k] + floydWarshallWeight[k][j];
            this.floydWarshallMatrix[i][j] = this.floydWarshallMatrix[i][k];
          }
        }
      }
    }
  }

  public at(x: number, y: number): Tile {
    const index = y * this.width + x;
    return this.tiles[index];
  }
}
