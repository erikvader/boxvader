import * as PIXI from 'pixi.js';
import { CustomSprite } from './customSprite';
export class EnemySprite extends CustomSprite {
  public constructor(filepath: PIXI.Texture, id: number) {
    super(filepath, id);
  }
}
