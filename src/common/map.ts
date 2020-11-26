import Tileset, { Tile } from './tileset';
import scifi_1 from '../../levels/vov-scifi-1.json';
import * as constants from './constants';
import * as misc from './misc';
import { Vec2 } from 'planck-js';

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
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    (this.x = x), (this.y = y), (this.width = width), (this.height = height);
  }

  public randomPoint(): Vec2 {
    return new Vec2(
      this.x + Math.random() * this.width,
      this.y + Math.random() * this.height,
    );
  }
}

export default class Map {
  public readonly name: string;
  public readonly width: number; // width in number of tiles
  public readonly height: number; // height in number of tiles
  public readonly tileset: Tileset;
  public readonly tileIds: number[];
  public readonly tiles: Tile[];
  public readonly playerSpawns: Region[];
  public readonly enemySpawns: Region[];

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

    if (tileIds.some(id => id >= tilesetLength))
      throw new Error(
        `Tile ID in map '${name}' is out of range for tileset '${tileset.name}'.`,
      );

    this.name = name;
    this.width = jsonMap.width;
    this.height = jsonMap.height;
    this.tileset = tileset;
    this.tileIds = tileIds;
    this.tiles = tileIds.map(id => this.tileset.tiles[id]);
    this.playerSpawns = playerLayer.objects.map(
      obj => new Region(obj.x, obj.y, obj.width, obj.height),
    );
    this.enemySpawns = enemyLayer.objects.map(
      obj => new Region(obj.x, obj.y, obj.width, obj.height),
    );
  }

  public at(x: number, y: number): Tile {
    const index = y * this.width + x;
    return this.tiles[index];
  }

  public randomPlayerSpawn(): Vec2 {
    return misc.randomChoice(this.playerSpawns)!.randomPoint();
  }
}

function getJson(name: string): NonNullable<MapJson> {
  // should we do a case-insensitive comparison?
  if (name === 'scifi-1') {
    return scifi_1;
  } else {
    throw new Error(`No map '${name}' found.`);
  }
}

function getNamedTileLayer(
  layers: Layer[],
  name: string,
): NonNullable<TileLayer> {
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

function getNamedObjectGroup(
  layers: Layer[],
  name: string,
): NonNullable<ObjectGroup> {
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
