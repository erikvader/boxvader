import * as PIXI from 'pixi.js';
import { CustomAnimatedSprite } from './customAnimatedSprite';
export class CharacterAnimatedSprite extends CustomAnimatedSprite {
  public shot_line?: PIXI.Graphics;
  public constructor(filepath: string, id: number) {
    super(filepath, id);
  }
}
