import Key from './key';
import * as PIXI from 'pixi.js';
import GameLoop, { GameLoopOpt } from '../common/game-loop';
import ByteBuffer from 'bytebuffer';
import Deque from '../common/deque';
import { Input } from '../common/misc';

import SpriteUtilities from './spriteUtilities';
import { deserializeSTC, serialize } from '../common/msg';
import State from '../common/state';
import display_map from './renderMap';
import { Player } from '../common/entity';
import {
  PLAYER_SPRITE,
  PLAYER_SPAWN_X_MIN,
  PLAYER_SPAWN_Y_MIN,
  PLAYER_SCALE,
  ENEMY_SCALE,
  ENEMY_SPRITE,
} from '../common/constants';
const su = new SpriteUtilities(PIXI);

export interface ClientGameOpt extends GameLoopOpt {
  sendInputFun: (buf: ByteBuffer) => void;
  renderer: any; // TODO: figure out type
  stage: PIXI.Stage;
}

export default class ClientGame extends GameLoop {
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
  private player_list = {};
  private enemy_list = {};

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
    display_map(this.stage);
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
  // TODO: split this function into smaller sub-functions
  serverMsg(data: any): void {
    if (!this.running || this.my_id === undefined) return;

    const message = deserializeSTC(data);

    if (this.my_id in message.inputAck) {
      this.inputHistory.discard_front_until(message.inputAck[this.my_id]);
    }

    this.update_players(message.state);
    this.update_enemies(message.state);

    if (message.stateNum <= this.states.first) {
      console.debug('got an old state');
    }

    this.states.reset(message.state, message.stateNum);
  }

  update_players(state: State) {
    // spawn new players
    for (const player of Object.values(state.players)) {
      if (this.player_list[player.id] === undefined) {
        // the positions of the players do not matter since they will be corrected by the server
        // TODO: we should probably think of a better solution in the future
        this.add_character(
          PLAYER_SPAWN_X_MIN,
          PLAYER_SPAWN_Y_MIN,
          PLAYER_SCALE,
          PLAYER_SPRITE,
          player.id,
        );

        if (player.id === this.my_id && this.my_id !== undefined) {
          this.my_sprite = this.player_list[this.my_id];
        }
      } else {
        this.decide_direction(player.id);
        const p = this.states.last_elem()!.players[player.id];
        this.player_list[player.id].x = p.position.x;
        this.player_list[player.id].y = p.position.y;
      }
    }
  }

  update_enemies(state: State) {
    this.remove_enemies();

    for (const enemy of Object.values(state.enemies)) {
      if (this.enemy_list[enemy.id] === undefined) {
        this.add_enemy(enemy.x, enemy.y, ENEMY_SCALE, ENEMY_SPRITE, enemy.id);
      } else {
        this.enemy_list[enemy.id].x = this.states.last_elem()!.enemies[
          enemy.id
        ].position.x;
        this.enemy_list[enemy.id].y = this.states.last_elem()!.enemies[
          enemy.id
        ].position.y;
      }
    }
  }

  remove_enemies() {
    for (const enemy_id in this.enemy_list) {
      if (this.states.last_elem()!.enemies[enemy_id] === undefined) {
        this.stage.removeChild(this.enemy_list[enemy_id]);
        delete this.enemy_list[enemy_id];
      }
    }
  }

  decide_direction(player_id: number): void {
    const state = this.states.last_elem();
    if (state === undefined) return;
    const dx =
      state.players[player_id].position.x - this.player_list[player_id].x;
    const dy =
      state.players[player_id].position.y - this.player_list[player_id].y;
    const pi = Math.PI;
    //Right
    if (dy === 0 && dx > 0) {
      this.player_list[player_id].rotation = pi * 0.5;
    }
    //Right Up
    if (dy < 0 && dx > 0) {
      this.player_list[player_id].rotation = pi * 0.25;
    }
    //Right Down
    if (dy > 0 && dx > 0) {
      this.player_list[player_id].rotation = pi * 0.75;
    }
    //Left
    if (dy === 0 && dx < 0) {
      this.player_list[player_id].rotation = -pi * 0.5;
    }
    //Left Up
    if (dy < 0 && dx < 0) {
      this.player_list[player_id].rotation = -pi * 0.25;
    }
    //Left Down
    if (dy > 0 && dx < 0) {
      this.player_list[player_id].rotation = -pi * 0.75;
    }
    //Down
    if (dy > 0 && dx === 0) {
      this.player_list[player_id].rotation = pi;
    }
    //Up
    if (dy < 0 && dx === 0) {
      this.player_list[player_id].rotation = 0;
    }
    //Still
    if (dy === 0 && dx === 0) {
      this.player_list[player_id].playAnimation(
        this.player_list[player_id].animationStates.walkUp,
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
    this.player_list[id] = character;
    this.stage.addChild(character);
    character.show(character.animationStates.down);
  }

  add_enemy(
    x: number,
    y: number,
    scale: number,
    img_filepath: string,
    id: number,
  ): void {
    const enemy = su.sprite(img_filepath);

    enemy.position.set(x, y);
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.id = id;
    enemy.scale.set(scale, scale);
    enemy.anchor.set(0.5, 0.5);
    this.enemy_list[id] = enemy;
    this.stage.addChild(enemy);
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
    leftUp: stripSize,
    up: stripSize * 2,
    upRight: stripSize * 3,
    right: stripSize * 4,
    rightDown: stripSize * 5,
    down: stripSize * 6,
    leftDown: stripSize * 7,
    walkLeftDown: [
      stripSize * 0 + walkOffset,
      stripSize * 0 + walkOffset + walkAnimationLength,
    ],
    walkLeft: [
      stripSize * 1 + walkOffset,
      stripSize * 1 + walkOffset + walkAnimationLength,
    ],
    walkLeftUp: [
      stripSize * 2 + walkOffset,
      stripSize * 2 + walkOffset + walkAnimationLength,
    ],
    walkUp: [
      stripSize * 3 + walkOffset,
      stripSize * 3 + walkOffset + walkAnimationLength,
    ],
    walkRightUp: [
      stripSize * 4 + walkOffset,
      stripSize * 4 + walkOffset + walkAnimationLength,
    ],
    walkRight: [
      stripSize * 5 + walkOffset,
      stripSize * 5 + walkOffset + walkAnimationLength,
    ],
    walkRightDown: [
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
