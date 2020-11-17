import Key from './key';
import * as PIXI from 'pixi.js';
import { default as GameLoop, GameLoopOpt } from '../common/game-loop';
import pson from '../common/pson';
import SpriteUtilities from './spriteUtilities';
import { deserializeSTC } from '../common/msg';
import State from '../common/state';
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

  private states: State[];
  public my_id?: number;
  private my_sprite?;
  private sprite_list = {};

  private up;
  private down;
  private left;
  private right;

  private initialized;

  private sendInputFun;

  // TODO: planned instance variables
  // private simulation: ClientSimulation;
  // private static readonly historyLength = 10;
  // private inputs: Input[];

  constructor(args: ClientGameOpt) {
    super(args);
    this.sendInputFun = args.sendInputFun;
    this.renderer = args.renderer;
    this.stage = args.stage;
    this.states = [];
  }

  public start(): Promise<void> {
    if (this.my_id === undefined) throw new Error('my_id is not set');
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
    if (this.my_sprite === undefined) return;
    this.my_sprite.x += this.my_sprite.vx;
    this.my_sprite.y += this.my_sprite.vy;
    this.sendInputFun(
      pson.encode({ x: this.my_sprite.x, y: this.my_sprite.y }).toArrayBuffer(),
    );
  }

  protected cleanup(): void {
    // TODO: reset pixi
    this.left.unsubscribe();
    this.right.unsubscribe();
    this.down.unsubscribe();
    this.up.unsubscribe();
  }

  serverMsg(data: any): void {
    if (!this.running || this.my_id === undefined) return;
    const message = deserializeSTC(data);
    //TODO: change this when we have client side prediction
    if (this.states.length === 0) {
      this.states.push(message.state);
      this.add_character(200, 200, 0.5, 'imgs/zombie_0.png', this.my_id);
      this.my_sprite = this.sprite_list[this.my_id];
      this.key_presses();
    } else {
      this.states[0] = message.state;
    }

    for (const player of Object.values(message.state.players)) {
      if (this.sprite_list[player.id] === undefined) {
        this.add_character(200, 200, 0.5, 'imgs/zombie_0.png', player.id);
      } else {
        this.sprite_list[player.id].x = this.states[0].players[
          player.id
        ].position.x;
        this.sprite_list[player.id].y = this.states[0].players[
          player.id
        ].position.y;
      }
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
    this.sprite_list[id] = character;
    this.stage.addChild(character);

    character.show(character.animationStates.down);
  }

  key_presses(): void {
    this.left = new Key('ArrowLeft');
    this.up = new Key('ArrowUp');
    this.right = new Key('ArrowRight');
    this.down = new Key('ArrowDown');

    //Left arrow key `press` method
    this.left.press = () => {
      if (this.up.isDown) {
        this.my_sprite.playAnimation(
          this.my_sprite.animationStates.walkLeft_up,
        );
      } else if (this.down.isDown) {
        this.my_sprite.playAnimation(
          this.my_sprite.animationStates.walkLeft_down,
        );
      } else {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkLeft);
      }

      this.my_sprite.vx = -ClientGame.movement_speed;
    };

    //Left arrow key `release` method
    this.left.release = () => {
      if (this.up.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkUp);
      } else if (this.down.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkDown);
      } else if (this.right.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkRight);
      } else {
        this.my_sprite.show(this.my_sprite.animationStates.left);
      }

      if (!this.right.isDown) {
        this.my_sprite.vx = 0;
      } else {
        this.my_sprite.vx = ClientGame.movement_speed;
      }
    };

    //Up
    this.up.press = () => {
      if (this.right.isDown) {
        this.my_sprite.playAnimation(
          this.my_sprite.animationStates.walkRight_up,
        );
      } else if (this.left.isDown) {
        this.my_sprite.playAnimation(
          this.my_sprite.animationStates.walkLeft_up,
        );
      } else {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkUp);
      }

      this.my_sprite.vy = -ClientGame.movement_speed;
    };

    this.up.release = () => {
      if (this.right.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkRight);
      } else if (this.left.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkLeft);
      } else if (this.down.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkDown);
      } else {
        this.my_sprite.show(this.my_sprite.animationStates.up);
      }

      if (!this.down.isDown) {
        this.my_sprite.vy = 0;
      } else {
        this.my_sprite.vy = ClientGame.movement_speed;
      }
    };

    //Right
    this.right.press = () => {
      if (this.up.isDown) {
        this.my_sprite.playAnimation(
          this.my_sprite.animationStates.walkRight_up,
        );
      } else if (this.down.isDown) {
        this.my_sprite.playAnimation(
          this.my_sprite.animationStates.walkRight_down,
        );
      } else {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkRight);
      }

      this.my_sprite.vx = ClientGame.movement_speed;
    };
    this.right.release = () => {
      if (this.up.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkUp);
      } else if (this.down.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkDown);
      } else if (this.left.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkLeft);
      } else {
        this.my_sprite.show(this.my_sprite.animationStates.right);
      }

      if (!this.left.isDown) {
        this.my_sprite.vx = 0;
      } else {
        this.my_sprite.vx = -ClientGame.movement_speed;
      }
    };

    //Down
    this.down.press = () => {
      if (this.right.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkRight);
      } else if (this.left.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkLeft);
      } else if (this.up.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkUp);
      } else {
        this.my_sprite.show(this.my_sprite.animationStates.up);
      }

      this.my_sprite.vy = ClientGame.movement_speed;
    };
    this.down.release = () => {
      if (this.right.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkRight);
      } else if (this.left.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkLeft);
      } else if (this.up.isDown) {
        this.my_sprite.playAnimation(this.my_sprite.animationStates.walkUp);
      } else {
        this.my_sprite.show(this.my_sprite.animationStates.down);
      }

      if (!this.up.isDown) {
        this.my_sprite.vy = 0;
      } else {
        this.my_sprite.vy = -ClientGame.movement_speed;
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
