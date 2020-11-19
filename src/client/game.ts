import Key from './key';
import * as PIXI from 'pixi.js';
import GameLoop, { GameLoopOpt } from '../common/game-loop';
import ByteBuffer from 'bytebuffer';
import Deque from '../common/deque';
import { Input } from '../common/misc';

import SpriteUtilities from './spriteUtilities';
import { deserializeSTC, serialize } from '../common/msg';
import State from '../common/state';
import {
  PLAYER_SPRITE,
  PLAYER_SPAWN_X,
  PLAYER_SPAWN_Y,
  PLAYER_SCALE,
} from '../common/constants';
const su = new SpriteUtilities(PIXI);

export interface ClientGameOpt extends GameLoopOpt {
  sendInputFun: (buf: ByteBuffer) => void;
  renderer: any; // TODO: figure out type
  stage: PIXI.Stage;
}

export default class ClientGame extends GameLoop {
  private static readonly movement_speed = 2;
  private renderer;
  private stage;

  // predicted states where the first one always is a `true` state from the
  // server.
  private states: Deque<State>;
  // inputs that caused all states in `states`.
  // private statesInputs: Deque<Input>

  // inputs not confirmed by server
  private inputHistory: Deque<Input>;

  public my_id?: number;
  private my_sprite?;
  private sprite_list = {};

  private up;
  private down;
  private left;
  private right;
  private fire;
  private initialized;

  private sendInputFun;

  // TODO: planned instance variables
  // private simulation: ClientSimulation;

  constructor(args: ClientGameOpt) {
    super(args);
    this.sendInputFun = args.sendInputFun;
    this.renderer = args.renderer;
    this.stage = args.stage;
    this.states = new Deque();
    this.inputHistory = new Deque();
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

    const inp: Input = {
      up: this.up.isDown,
      left: this.left.isDown,
      right: this.right.isDown,
      down: this.down.isDown,
      fire: this.fire.isDown,
    };

    this.inputHistory.push_back(inp);

    this.sendInputFun(serialize({ inputs: this.inputHistory }));
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

    if (this.my_id in message.inputAck) {
      this.inputHistory.discard_front_until(message.inputAck[this.my_id]);
    }

    if (message.stateNum <= this.states.first) {
      console.debug('got an old state');
    }
    this.states.reset(message.state, message.stateNum);

    // spawn new players
    for (const player of Object.values(message.state.players)) {
      if (this.sprite_list[player.id] === undefined) {
        this.add_character(
          PLAYER_SPAWN_X,
          PLAYER_SPAWN_Y,
          PLAYER_SCALE,
          PLAYER_SPRITE,
          player.id,
        );
        if (player.id === this.my_id) {
          this.my_sprite = this.sprite_list[this.my_id];
          this.key_presses();
        }
      } else {
        const p = this.states.last_ele()!.players[player.id];
        this.sprite_list[player.id].x = p.position.x;
        this.sprite_list[player.id].y = p.position.y;
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
    this.fire = new Key(' '); //Spacebar

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
