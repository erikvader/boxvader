import * as PIXI from 'pixi.js';
import { CustomSprite } from '../client/customSprite';
export class CharacterSprite extends CustomSprite {
    public shot_line?:PIXI.Graphics;
    public constructor(
      filepath: PIXI.Texture,
      id: number
    ) {
      super(filepath, id);
    }
  
  }