import * as PIXI from 'pixi.js';

export class CustomSprite extends PIXI.Sprite {
    public id: number;
    public hpBar?: PIXI.Graphics;
    public constructor(
      filepath: PIXI.Texture,
      id: number    
      ) {
      super(filepath);
      this.id = id;


    }
    public setHpBar(hpBar: PIXI.Graphics){
      this.hpBar = hpBar;
    }
  }