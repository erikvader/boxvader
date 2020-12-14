import * as PIXI from 'pixi.js';

export class CharacterSprite extends PIXI.Sprite {
    public id: number;
    public shot_line:any = NaN;
    public constructor(
      filepath: PIXI.Texture,
      id: number
    ) {
      super(filepath);
      this.id = id;
    }
  
  }