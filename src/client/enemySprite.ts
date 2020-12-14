import * as PIXI from 'pixi.js';

export class EnemySprite extends PIXI.Sprite {
    public id: number;

    public constructor(
      filepath: PIXI.Texture,
      id: number
    ) {
      super(filepath);
      this.id = id;
    }
  
  }