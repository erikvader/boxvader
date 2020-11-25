import Tileset, { Tile } from './tileset';
import scifi_1 from '../../levels/vov-scifi-1.json';
import { Vec2 } from 'planck-js';

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

    console.log(this.getInput(new Vec2(64, 64), new Vec2(460, 460)));
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
        if (i - this.width >= 0 && this.tiles[i - this.width].walkable) {
          floydWarshallWeight[i][i - this.width] = 1;
        }
        //checks south
        if (
          i + this.width <= this.width * this.height &&
          this.tiles[i + this.width].walkable
        ) {
          floydWarshallWeight[i][i + this.width] = 1;
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
          (i - this.width - 1) % this.width !== this.width - 1 &&
          i - this.width - 1 >= 0 &&
          this.tiles[this.width - 1].walkable
        ) {
          floydWarshallWeight[i][i - this.width - 1] = Math.sqrt(2);
        }
        //checks northwest
        if (
          (i - this.width + 1) % this.width !== 0 &&
          i - this.width + 1 >= 0 &&
          this.tiles[i - this.width + 1].walkable
        ) {
          floydWarshallWeight[i][i - this.width + 1] = Math.sqrt(2);
        }
        //checks southeast
        if (
          (i + this.width + 1) % this.width !== this.width - 1 &&
          i + this.width + 1 <= this.width * this.height &&
          this.tiles[i + this.width + 1].walkable
        ) {
          floydWarshallWeight[i][i + this.width + 1] = Math.sqrt(2);
        }
        //checks southwest
        if (
          (i + this.width - 1) % this.width !== 0 &&
          i + this.width - 1 <= this.width * this.height &&
          this.tiles[i + this.width - 1].walkable
        ) {
          floydWarshallWeight[i][i + this.width - 1] = Math.sqrt(2);
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

  private getInput(current: Vec2, target: Vec2): Vec2 {
    const currentTile = this.positionToTile(current);
    const targetTile = this.positionToTile(target);

    const tile = this.floydWarshallMatrix[currentTile][targetTile];

    return this.tileToPosition(tile);
  }

  private positionToTile(position: Vec2): number {
    const widthCoord = Math.round(position.x / this.tileset.tileWidth);
    const heightCoord = Math.round(position.y / this.tileset.tileHeight);

    return this.height * heightCoord + widthCoord;
  }

  private tileToPosition(position: number): Vec2 {
    const x =
      Math.floor(position % this.width) * this.tileset.tileWidth +
      this.tileset.tileWidth / 2;
    const y =
      Math.floor(position / this.height) * this.tileset.tileHeight +
      this.tileset.tileHeight / 2;

    return new Vec2(x, y);
  }

  public at(x: number, y: number): Tile {
    const index = y * this.width + x;
    return this.tiles[index];
  }
}
