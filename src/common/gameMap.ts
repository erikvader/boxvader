import Tileset, { Tile } from './tileset';
import scifi_1 from '../../levels/vov-scifi-1.json';
import { Vec2 } from 'planck-js';
export interface MapJson {
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

export default class GameMap {
  public readonly name: string;
  public readonly width: number; // width in number of tiles
  public readonly height: number; // height in number of tiles
  public readonly tileset: Tileset;
  public readonly tileIds: number[];
  public readonly tiles: Tile[];
  public floydWarshallMatrix: number[][];
  public floydWarshallWeightMatrix: number[][];

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
    this.tiles = this.tileIds.map(id => this.tileset.tiles[id]);
    this.floydWarshallMatrix = [[]];
    this.floydWarshallWeightMatrix = [[]];

    this.floydWarshallAlgorithm();
  }

  private floydWarshallAlgorithm(): void {
    for (let i = 0; i < this.width * this.height; i++) {
      this.floydWarshallWeightMatrix[i] = [];
      this.floydWarshallMatrix[i] = [];
      for (let j = 0; j < this.height * this.width; j++) {
        this.floydWarshallWeightMatrix[i][j] = Infinity;
        if (this.tiles[j].walkable) {
          this.floydWarshallMatrix[i][j] = j;
        } else {
          this.floydWarshallMatrix[i][j] = NaN;
        }
      }
    }
    for (let i = 0; i < this.width * this.height; i++) {
      this.floydWarshallWeightMatrix[i][i] = 0;
      this.floydWarshallMatrix[i][i] = i;
      if (this.tiles[i].walkable) {
        //checks north
        if (i - this.width >= 0 && this.tiles[i - this.width].walkable) {
          this.floydWarshallWeightMatrix[i][i - this.width] = 1;
        }
        //checks south
        if (
          i + this.width <= this.width * this.height &&
          this.tiles[i + this.width].walkable
        ) {
          this.floydWarshallWeightMatrix[i][i + this.width] = 1;
        }
        //checks west
        if (
          (i - 1) % this.width !== this.width - 1 &&
          this.tiles[i - 1].walkable
        ) {
          this.floydWarshallWeightMatrix[i][i - 1] = 1;
        }
        //checks east
        if ((i + 1) % this.width !== 0 && this.tiles[i + 1].walkable) {
          this.floydWarshallWeightMatrix[i][i + 1] = 1;
        }
        //checks northeast
        if (
          (i - this.width + 1) % this.width !== this.width - 1 &&
          i - this.width + 1 >= 0 &&
          this.tiles[i - this.width + 1].walkable &&
          this.tiles[i - this.width].walkable &&
          this.tiles[i + 1].walkable
        ) {
          this.floydWarshallWeightMatrix[i][i - this.width + 1] = Math.sqrt(2);
        }
        //checks northwest
        if (
          (i - this.width - 1) % this.width !== 0 &&
          i - this.width - 1 >= 0 &&
          this.tiles[i - this.width + 1].walkable &&
          this.tiles[i - this.width].walkable &&
          this.tiles[i - 1].walkable
        ) {
          this.floydWarshallWeightMatrix[i][i - this.width - 1] = Math.sqrt(2);
        }
        //checks southeast
        if (
          (i + this.width + 1) % this.width !== this.width - 1 &&
          i + this.width + 1 <= this.width * this.height &&
          this.tiles[i + this.width + 1].walkable &&
          this.tiles[i + this.width].walkable &&
          this.tiles[i + 1].walkable
        ) {
          this.floydWarshallWeightMatrix[i][i + this.width + 1] = Math.sqrt(2);
        }
        //checks southwest
        if (
          (i + this.width - 1) % this.width !== 0 &&
          i + this.width - 1 <= this.width * this.height &&
          this.tiles[i + this.width - 1].walkable &&
          this.tiles[i + this.width].walkable &&
          this.tiles[i - 1].walkable
        ) {
          this.floydWarshallWeightMatrix[i][i + this.width - 1] = Math.sqrt(2);
        }
      }
    }
    for (let k = 0; k < this.width * this.height; k++) {
      for (let j = 0; j < this.width * this.height; j++) {
        for (let i = 0; i < this.width * this.height; i++) {
          if (
            this.floydWarshallWeightMatrix[i][j] >
            this.floydWarshallWeightMatrix[i][k] +
              this.floydWarshallWeightMatrix[k][j]
          ) {
            this.floydWarshallWeightMatrix[i][j] =
              this.floydWarshallWeightMatrix[i][k] +
              this.floydWarshallWeightMatrix[k][j];
            this.floydWarshallMatrix[i][j] = this.floydWarshallMatrix[i][k];
          }
        }
      }
    }
  }

  public getInput(current: Vec2, target: Vec2): Vec2 {
    const currentTile = this.positionToTile(current);
    const targetTile = this.positionToTile(target);

    const tile = this.floydWarshallMatrix[currentTile][targetTile];

    return this.tileToPosition(tile);
  }

  public positionToTile(position: Vec2): number {
    const widthCoord =
      Math.round((position.x + 0.1) / this.tileset.tileWidth) - 1;
    const heightCoord =
      Math.round((position.y + 0.1) / this.tileset.tileHeight) - 1;

    return this.height * heightCoord + widthCoord;
  }

  public tileToPosition(tilePosition: number): Vec2 {
    const x =
      Math.floor(tilePosition % this.width) * this.tileset.tileWidth +
      this.tileset.tileWidth / 2;
    const y =
      Math.floor(tilePosition / this.height) * this.tileset.tileHeight +
      this.tileset.tileHeight / 2;

    return new Vec2(x, y);
  }

  public at(x: number, y: number): Tile {
    const index = y * this.width + x;
    return this.tiles[index];
  }
}
