import Key from './key';
import * as PIXI from 'pixi.js';
import { default as GameLoop, GameLoopOpt } from '../common/game-loop';
import pson from '../common/pson';
import { Vec2 } from 'planck-js';

import SpriteUtilities from './spriteUtilities';
import { deserializeSTC, ClientToServer, serialize } from '../common/msg';
import State from '../common/state';
import display_map from './renderMap';

import {
  PLAYER_SPRITE,
  PLAYER_SPAWN_X,
  PLAYER_SPAWN_Y,
  PLAYER_SCALE,
} from '../common/constants';
import Tileset from '../common/tileset';
const su = new SpriteUtilities(PIXI);

export interface ClientGameOpt extends GameLoopOpt {
  sendInputFun: (any) => void;
  renderer: any; // TODO: figure out type
  stage: PIXI.Stage;
}

export default class ClientGame extends GameLoop {
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
  private fire;
  private counter = 0;
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

    const msg: ClientToServer = {
      seqNum: this.counter,
      inputs: {
        up: this.up.isDown,
        left: this.left.isDown,
        right: this.right.isDown,
        down: this.down.isDown,
        fire: this.fire.isDown,
      },
    };

    this.sendInputFun(serialize(msg));
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
    if (!this.running || this.my_id === undefined) return;
    const message = deserializeSTC(data);
    //TODO: change this when we have client side prediction
    if (this.states.length === 0) {
      display_map(this.stage);
      this.states.push(message.state);
      this.add_character(
        PLAYER_SPAWN_X,
        PLAYER_SPAWN_Y,
        PLAYER_SCALE,
        PLAYER_SPRITE,
        this.my_id,
      );
      this.my_sprite = this.sprite_list[this.my_id];
      this.key_presses();
    } else {
      this.states[0] = message.state;
    }

    for (const player of Object.values(message.state.players)) {
      if (this.sprite_list[player.id] === undefined) {
        this.add_character(
          PLAYER_SPAWN_X,
          PLAYER_SPAWN_Y,
          PLAYER_SCALE,
          PLAYER_SPRITE,
          player.id,
        );
      } else {
        this.decide_direction(player.id);
        this.sprite_list[player.id].x = this.states[0].players[
          player.id
        ].position.x;

        this.sprite_list[player.id].y = this.states[0].players[
          player.id
        ].position.y;
      }
    }
  }
  decide_direction(player_id: number) {
    const dx =
      this.states[0].players[player_id].position.x -
      this.sprite_list[player_id].x;
    const dy =
      this.states[0].players[player_id].position.y -
      this.sprite_list[player_id].y;
    const pi = 3.141592;
    //Right
    if (dy === 0 && dx > 0) {
      this.sprite_list[player_id].rotation = pi * 0.5;
    }
    //Right Up
    if (dy < 0 && dx > 0) {
      this.sprite_list[player_id].rotation = pi * 0.25;
    }
    //Right Down
    if (dy > 0 && dx > 0) {
      this.sprite_list[player_id].rotation = pi * 0.75;
    }
    //Left
    if (dy === 0 && dx < 0) {
      this.sprite_list[player_id].rotation = -pi * 0.5;
    }
    //Left Up
    if (dy < 0 && dx < 0) {
      this.sprite_list[player_id].rotation = -pi * 0.25;
    }
    //Left Down
    if (dy > 0 && dx < 0) {
      this.sprite_list[player_id].rotation = -pi * 0.75;
    }
    //Down
    if (dy > 0 && dx === 0) {
      this.sprite_list[player_id].rotation = pi;
    }
    //Up
    if (dy < 0 && dx === 0) {
      this.sprite_list[player_id].rotation = 0;
    }
    //Still
    if (dy === 0 && dx === 0) {
      this.sprite_list[player_id].playAnimation(
        this.sprite_list[player_id].animationStates.walkUp,
      );
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
    walkLeft_down: [
      stripSize * 0 + walkOffset,
      stripSize * 0 + walkOffset + walkAnimationLength,
    ],
    walkLeft: [
      stripSize * 1 + walkOffset,
      stripSize * 1 + walkOffset + walkAnimationLength,
    ],
    walkLeft_up: [
      stripSize * 2 + walkOffset,
      stripSize * 2 + walkOffset + walkAnimationLength,
    ],
    walkUp: [
      stripSize * 3 + walkOffset,
      stripSize * 3 + walkOffset + walkAnimationLength,
    ],
    walkRight_up: [
      stripSize * 4 + walkOffset,
      stripSize * 4 + walkOffset + walkAnimationLength,
    ],
    walkRight: [
      stripSize * 5 + walkOffset,
      stripSize * 5 + walkOffset + walkAnimationLength,
    ],
    walkRight_down: [
      stripSize * 6 + walkOffset,
      stripSize * 6 + walkOffset + walkAnimationLength,
    ],
    walkDown: [
      stripSize * 7 + walkOffset,
      stripSize * 7 + walkOffset + walkAnimationLength,
    ],
  };
  return animation;
}
