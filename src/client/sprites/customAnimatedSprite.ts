import * as PIXI from 'pixi.js';

export class CustomAnimatedSprite extends PIXI.AnimatedSprite {
  public id: number;
  public hpBar?: PIXI.Graphics;
  public constructor(filepath: string, id: number) {
    let sheet = PIXI.Loader.shared.resources[filepath].spritesheet;
    const textureArray: PIXI.Texture[] = [];
    for (let texture of Object.values(sheet!.textures)) {
      textureArray.push(texture as PIXI.Texture);
    }
    super(textureArray);
    this.id = id;
    this.animationSpeed = 0.25;
    this.play();
  }
}
