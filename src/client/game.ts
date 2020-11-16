import Key from './key';
import * as PIXI from 'pixi.js';
import { default as GameLoop, GameLoopOpt } from '../common/game-loop.ts';
import { Vec2 } from 'planck-js';
import {ClientMsg} from '../common/msg'
import SpriteUtilities from './spriteUtilities';
const su = new SpriteUtilities(PIXI);

export interface ClientGameOpt extends GameLoopOpt {
  sendInputFun: (any) => void;
  renderer: any; // TODO: figure out type
  stage: PIXI.Stage;
}

export default class ClientGame extends GameLoop {
  private static readonly movement_speed = 2;

  private renderer;
  private stage;

  private player_list = {};
  public my_id?: number;
  private player?;

  private up;
  private down;
  private left;
  private right;
  private fire;
  private counter = 0;
  private initialized;

  private sendInputFun;

  // TODO: planned instance variables
  // private simulation: ClientSimulation;
  // private static readonly historyLength = 10;
  // private states: State[];
  // private inputs: Input[];

  constructor(args: ClientGameOpt) {
    super(args);
    this.sendInputFun = args.sendInputFun;
    this.renderer = args.renderer;
    this.stage = args.stage;
  }

  public start(): Promise<void> {
    if (this.my_id === undefined) throw new Error('my_id is not set');
    this.add_character(200, 200, 0.5, 'imgs/zombie_0.png', this.my_id);
    this.player = this.player_list[this.my_id];
    this.key_presses();
    return super.start();
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  protected timer(prevStep?: number): void {
    window.requestAnimationFrame(() => {
      this.update();
      if (this.running) this.timer();
    });
  }

  afterUpdate(): void {
    this.renderer.render(this.stage);
  }

  doUpdate(): void {
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    const msg: ClientMsg = {
                            seqNum: this.counter,
                            inputs:
                            {
                              up: this.up.isDown,
                              left: this.left.isDown,
                              right: this.right.isDown,
                              down: this.down.isDown,
                              fire: this.fire.isDown
                            }
                          }

    this.sendInputFun(
      msg
    );
    this.counter = this.counter + 1;
  }

  protected cleanup(): void {
    // TODO: reset pixi
    this.left.unsubscribe();
    this.right.unsubscribe();
    this.down.unsubscribe();
    this.up.unsubscribe();
  }

  serverMsg(data: any): void {
    if (!this.running) return;
    for (const [pid, coord] of data) {
      if (this.player_list[pid] === undefined) {
        this.add_character(200, 200, 0.5, 'imgs/zombie_0.png', pid);
      }
      this.player_list[pid].x = coord.x;
      this.player_list[pid].y = coord.y;
    }
  }

  add_character(
    x: number,
    y: number,
    scale: number,
    img_filepath: string,
    id: number,
  ): void {
    const character = load_zombie(img_filepath);

    character.position.set(x, y);
    character.vx = 0;
    character.vy = 0;
    character.id = id;
    character.scale.set(scale, scale);
    character.anchor.set(0.5, 0.5);
    this.player_list[id] = character;
    this.stage.addChild(character);

    character.show(character.animationStates.down);
  }

  key_presses(): void {
    this.left = new Key('ArrowLeft');
    this.up = new Key('ArrowUp');
    this.right = new Key('ArrowRight');
    this.down = new Key('ArrowDown');
    this.fire = new Key(' '); //Spacebar

    //Left arrow key `press` method
    this.left.press = () => {
      if (this.up.isDown) {
        this.player.playAnimation(this.player.animationStates.walkLeft_up);
      } else if (this.down.isDown) {
        this.player.playAnimation(this.player.animationStates.walkLeft_down);
      } else {
        this.player.playAnimation(this.player.animationStates.walkLeft);
      }

      this.player.vx = -ClientGame.movement_speed;
    };

    //Left arrow key `release` method
    this.left.release = () => {
      if (this.up.isDown) {
        this.player.playAnimation(this.player.animationStates.walkUp);
      } else if (this.down.isDown) {
        this.player.playAnimation(this.player.animationStates.walkDown);
      } else if (this.right.isDown) {
        this.player.playAnimation(this.player.animationStates.walkRight);
      } else {
        this.player.show(this.player.animationStates.left);
      }

      if (!this.right.isDown) {
        this.player.vx = 0;
      } else {
        this.player.vx = ClientGame.movement_speed;
      }
    };

    //Up
    this.up.press = () => {
      if (this.right.isDown) {
        this.player.playAnimation(this.player.animationStates.walkRight_up);
      } else if (this.left.isDown) {
        this.player.playAnimation(this.player.animationStates.walkLeft_up);
      } else {
        this.player.playAnimation(this.player.animationStates.walkUp);
      }

      this.player.vy = -ClientGame.movement_speed;
    };

    this.up.release = () => {
      if (this.right.isDown) {
        this.player.playAnimation(this.player.animationStates.walkRight);
      } else if (this.left.isDown) {
        this.player.playAnimation(this.player.animationStates.walkLeft);
      } else if (this.down.isDown) {
        this.player.playAnimation(this.player.animationStates.walkDown);
      } else {
        this.player.show(this.player.animationStates.up);
      }

      if (!this.down.isDown) {
        this.player.vy = 0;
      } else {
        this.player.vy = ClientGame.movement_speed;
      }
    };

    //Right
    this.right.press = () => {
      if (this.up.isDown) {
        this.player.playAnimation(this.player.animationStates.walkRight_up);
      } else if (this.down.isDown) {
        this.player.playAnimation(this.player.animationStates.walkRight_down);
      } else {
        this.player.playAnimation(this.player.animationStates.walkRight);
      }

      this.player.vx = ClientGame.movement_speed;
    };
    this.right.release = () => {
      if (this.up.isDown) {
        this.player.playAnimation(this.player.animationStates.walkUp);
      } else if (this.down.isDown) {
        this.player.playAnimation(this.player.animationStates.walkDown);
      } else if (this.left.isDown) {
        this.player.playAnimation(this.player.animationStates.walkLeft);
      } else {
        this.player.show(this.player.animationStates.right);
      }

      if (!this.left.isDown) {
        this.player.vx = 0;
      } else {
        this.player.vx = -ClientGame.movement_speed;
      }
    };

    //Down
    this.down.press = () => {
      if (this.right.isDown) {
        this.player.playAnimation(this.player.animationStates.walkRight);
      } else if (this.left.isDown) {
        this.player.playAnimation(this.player.animationStates.walkLeft);
      } else if (this.up.isDown) {
        this.player.playAnimation(this.player.animationStates.walkUp);
      } else {
        this.player.show(this.player.animationStates.up);
      }

      this.player.vy = ClientGame.movement_speed;
    };
    this.down.release = () => {
      if (this.right.isDown) {
        this.player.playAnimation(this.player.animationStates.walkRight);
      } else if (this.left.isDown) {
        this.player.playAnimation(this.player.animationStates.walkLeft);
      } else if (this.up.isDown) {
        this.player.playAnimation(this.player.animationStates.walkUp);
      } else {
        this.player.show(this.player.animationStates.down);
      }

      if (!this.up.isDown) {
        this.player.vy = 0;
      } else {
        this.player.vy = -ClientGame.movement_speed;
      }
    };
  }
}

function load_zombie(img_filepath) {
  const frames = su.filmstrip(img_filepath, 128, 128);
  const animation = su.sprite(frames);
  const stripSize = 36;
  const walkOffset = 4;
  const walkAnimationLength = 7;

  animation.fps = 12;
  animation.animationStates = {
    left: 0,
    left_up: stripSize,
    up: stripSize * 2,
    up_right: stripSize * 3,
    right: stripSize * 4,
    right_down: stripSize * 5,
    down: stripSize * 6,
    left_down: stripSize * 7,
    walkLeft: [
      stripSize * 0 + walkOffset,
      stripSize * 0 + walkOffset + walkAnimationLength,
    ],
    walkLeft_up: [
      stripSize * 1 + walkOffset,
      stripSize * 1 + walkOffset + walkAnimationLength,
    ],
    walkUp: [
      stripSize * 2 + walkOffset,
      stripSize * 2 + walkOffset + walkAnimationLength,
    ],
    walkRight_up: [
      stripSize * 3 + walkOffset,
      stripSize * 3 + walkOffset + walkAnimationLength,
    ],
    walkRight: [
      stripSize * 4 + walkOffset,
      stripSize * 4 + walkOffset + walkAnimationLength,
    ],
    walkRight_down: [
      stripSize * 5 + walkOffset,
      stripSize * 5 + walkOffset + walkAnimationLength,
    ],
    walkDown: [
      stripSize * 6 + walkOffset,
      stripSize * 6 + walkOffset + walkAnimationLength,
    ],
    walkLeft_down: [
      stripSize * 7 + walkOffset,
      stripSize * 7 + walkOffset + walkAnimationLength,
    ],
  };
  return animation;
}
