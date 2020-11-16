import SpriteUtilities from './spriteUtilities.js';
import scifi from '../../levels/vov-scifi-tileset.json';

interface TilesetJson {
  image: string;
  imagewidth: number;
  imageheight: number;
  tilewidth: number;
  tileheight: number;
}

function getJson(name: string): TilesetJson {
  // should we do a case-insensitive comparison?
  if (name === 'scifi') {
    return scifi;
  } else {
    throw new Error(`No tileset '${name}' found.`);
  }
}

export default class Tileset {
  public readonly name: string;
  public readonly imageName: string;
  public readonly tileWidth: number;
  public readonly tileHeight: number;
  public readonly tiles: SpriteUtilities.Texture[];

  constructor(name: string, su: SpriteUtilities) {
    const json = getJson(name);

    const dx = json.tilewidth;
    const dy = json.tileheight;

    let texturePath = json.image;
    const imgsIndex = texturePath.indexOf('imgs/');
    if (imgsIndex !== -1) texturePath = texturePath.substring(imgsIndex);

    const baseTexture = new su.Texture(su.TextureCache[texturePath]);
    if (!baseTexture) {
      throw new Error(`No texture '${texturePath}' found.`);
    }

    const tiles = new Array<SpriteUtilities.Texture>(dx * dy);

    for (let y = 0; y < json.imageheight; y += dy) {
      for (let x = 0; x < json.imagewidth; x += dx) {
        const rectangle = new su.Rectangle(x, y, dx, dy);
        const texture = new su.Texture(baseTexture);
        texture.frame = rectangle;

        tiles.push(texture);
      }
    }

    this.name = name;
    this.imageName = texturePath;
    this.tileWidth = dx;
    this.tileHeight = dy;
    this.tiles = tiles;
  }
}
