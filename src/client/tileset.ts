import { Texture, Rectangle } from 'pixi.js';
import SpriteUtilities from './spriteUtilities.js';
import scifi from '../../levels/vov-scifi-tileset.json';

interface TilesetJson {
  image: string;
  imagewidth: number;
  imageheight: number;
  tilewidth: number;
  tileheight: number;
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
  readonly texture: Texture;
  readonly walkable: boolean;
}

/**
 * Tilesets have names, an image name, width and height of its tiles and an array of the actual tiles.
 */
export default class Tileset {
  public readonly name: string;
  public readonly imageName: string;
  public readonly tileWidth: number;
  public readonly tileHeight: number;
  public readonly tiles: Tile[];

  constructor(name: string, su: SpriteUtilities, loadTextures: boolean) {
    const jsonTileset = getJson(name);

    const dx = jsonTileset.tilewidth;
    const dy = jsonTileset.tileheight;

    let texturePath = jsonTileset.image;
    const imgsIndex = texturePath.indexOf('imgs/');
    if (imgsIndex !== -1) texturePath = texturePath.substring(imgsIndex);

    let baseTexture: Texture = null;
    if (loadTextures) {
      baseTexture = new su.Texture(su.TextureCache[texturePath]);
      if (!baseTexture) {
        throw new Error(`No texture '${texturePath}' found.`);
      }
    }

    const tiles = new Array<Tile>(dx * dy);
    let currentId = 0;

    for (let y = 0; y < jsonTileset.imageheight; y += dy) {
      for (let x = 0; x < jsonTileset.imagewidth; x += dx) {
        let texture: Texture = null;

        if (loadTextures) {
          // create a texture
          const rectangle = new Rectangle(x, y, dx, dy);
          texture = new Texture(baseTexture);
          texture.frame = rectangle;
        }

        // the tile is marked as non-walkable if it has any collisions at all
        const walkable = jsonTileset.tiles
          .filter(jsonTile => jsonTile.id === currentId)
          .some(jsonTile => jsonTile.objectgroup.objects.length > 0);

        const tile = {
          id: currentId,
          texture: texture,
          walkable: walkable,
        };

        ++currentId;
        tiles.push(tile);
      }
    }

    this.name = name;
    this.imageName = texturePath;
    this.tileWidth = dx;
    this.tileHeight = dy;
    this.tiles = tiles;
  }
}
