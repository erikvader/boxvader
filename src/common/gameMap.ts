import Tileset, { Tile } from './tileset';
import scifi_1 from '../../levels/vov-scifi-1.json';
import { Vec2 } from 'planck-js';
import * as misc from './misc';
import * as constants from './constants';

interface MapJson {
  width: number;
  height: number;
  layers: Layer[];
}

interface Layer {
  id: number;
  type: string;
  name: string;
}
interface TileLayer extends Layer {
  data: number[];
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ObjectGroup extends Layer {
  objects: ObjectGroupObject[];
}

interface ObjectGroupObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A region of a map. */
export class Region {
  /** Upper left corner of the region. */
  position: Vec2;
  /** Size of the region. */
  size: Vec2;

  constructor(position: Vec2, size: Vec2) {
    this.position = position;
    this.size = size;
  }

  /** Return a random point within the region. */
  public randomPoint(): Vec2 {
    return Vec2.add(
      this.position,
      Vec2(Math.random() * this.size.x, Math.random() * this.size.y),
    );
  }
}
export default class GameMap {
  public readonly name: string;
  public readonly width: number; // width in number of tiles
  public readonly height: number; // height in number of tiles
  public readonly tileset: Tileset;
  public readonly tileIds: number[];
  public readonly tiles: Tile[];

  public readonly playerSpawns: Region[];
  public readonly enemySpawns: Region[];

  public floydWarshallMatrix: number[][];
  public floydWarshallWeightMatrix: number[][];

  constructor(name: string, tilesetName: string) {
    const jsonMap = getJson(name);
    const tileset = new Tileset(tilesetName);

    const tileLayer = getNamedTileLayer(
      jsonMap.layers,
      constants.MAP_TILE_LAYER_LAYER_NAME,
    );
    const playerLayer = getNamedObjectGroup(
      jsonMap.layers,
      constants.MAP_PLAYER_SPAWN_LAYER_NAME,
    );
    const enemyLayer = getNamedObjectGroup(
      jsonMap.layers,
      constants.MAP_ENEMY_SPAWN_LAYER_NAME,
    );

    const tileIds = tileLayer.data.map(id => id - 1);
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
    this.tileIds = tileIds;
    this.tiles = tileIds.map(id => this.tileset.tiles[id]);

    const to_logical = (pix: number): number =>
      (pix * constants.TILE_LOGICAL_SIZE) / this.tileset.tileWidth;

    this.playerSpawns = playerLayer.objects.map(
      obj =>
        new Region(
          Vec2(to_logical(obj.x), to_logical(obj.y)),
          Vec2(to_logical(obj.width), to_logical(obj.height)),
        ),
    );
    this.enemySpawns = enemyLayer.objects.map(
      obj =>
        new Region(
          Vec2(to_logical(obj.x), to_logical(obj.y)),
          Vec2(to_logical(obj.width), to_logical(obj.height)),
        ),
    );

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
    const widthCoord = Math.floor(position.x / constants.TILE_LOGICAL_SIZE);
    const heightCoord = Math.floor(position.y / constants.TILE_LOGICAL_SIZE);

    return this.height * heightCoord + widthCoord;
  }

  public tileToPosition(tilePosition: number): Vec2 {
    const x =
      Math.floor(tilePosition % this.width) * constants.TILE_LOGICAL_SIZE +
      constants.TILE_LOGICAL_SIZE / 2;
    const y =
      Math.floor(tilePosition / this.height) * constants.TILE_LOGICAL_SIZE +
      constants.TILE_LOGICAL_SIZE / 2;

    return new Vec2(x, y);
  }

  public at(x: number, y: number): Tile {
    const index = y * this.width + x;
    return this.tiles[index];
  }

  public total_pixel_size(): [number, number] {
    const w = this.width * constants.TILE_TARGET_SIZE_PIXELS;
    const h = this.height * constants.TILE_TARGET_SIZE_PIXELS;
    return [w, h];
  }

  /** Return a random point where a player can spawn. */
  public randomPlayerSpawn(): Vec2 {
    const tmp = misc.randomChoice(this.playerSpawns);
    if (tmp === undefined) throw new Error("there aren't any spawn locations");
    return tmp.randomPoint();
  }

  /** Return a random point where an enemy can spawn. */
  public randomEnemySpawn(): Vec2 {
    const tmp = misc.randomChoice(this.enemySpawns);
    if (tmp === undefined) throw new Error("there aren't any spawn locations");
    return tmp.randomPoint();
  }
}

function getJson(name: string): MapJson {
  // should we do a case-insensitive comparison?
  if (name === 'scifi-1') {
    return scifi_1;
  } else {
    throw new Error(`No map '${name}' found.`);
  }
}

function getNamedTileLayer(layers: Layer[], name: string): TileLayer {
  const tileLayers = layers.filter(
    layer => layer.type === 'tilelayer' && layer.name === name,
  ) as TileLayer[];

  if (tileLayers.length === 0)
    throw new Error(`No tile layer named '${name}' exists.`);
  else if (tileLayers.length > 1)
    console.warn(
      `There exists ${tileLayers.length} tile layers named '${name}'.`,
    );

  return tileLayers[0];
}

function getNamedObjectGroup(layers: Layer[], name: string): ObjectGroup {
  const objectGroups = layers.filter(
    layer => layer.type === 'objectgroup' && layer.name === name,
  ) as ObjectGroup[];

  if (objectGroups.length === 0)
    throw new Error(`No object group named '${name}' exists.`);
  else if (objectGroups.length > 1)
    console.warn(
      `There exists ${objectGroups.length} object groups named '${name}'.`,
    );

  return objectGroups[0];
}
