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
import GameMap from '../common/gameMap';
import Weapon, { E11_blaster_rifle } from '../common/weapon';
import {
  PLAYER_SPRITE,
  LOGICAL_TO_PIXELS,
  PLAYER_SIZE,
  ENEMY_SIZE,
  ENEMY_SPRITE,
} from '../common/constants';
const su = new SpriteUtilities(PIXI);

export interface ClientGameOpt extends GameLoopOpt {
  sendInputFun: (buf: ByteBuffer) => void;
  renderer: PIXI.Renderer;
  stage: PIXI.Stage;
  map: GameMap;
  my_id: number;
}

export default class ClientGame extends GameLoop {
  private renderer;
  private stage;
  private map;

  // predicted states where the first one always is a `true` state from the
  // server.
  private states: Deque<State>;
  // inputs that caused all states in `states`.
  // private statesInputs: Deque<Input>

  // inputs not confirmed by server
  private inputHistory: Deque<Input>;

  private my_id: number;
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

  constructor(args: ClientGameOpt) {
    super(args);
    this.sendInputFun = args.sendInputFun;
    this.renderer = args.renderer;
    this.stage = args.stage;
    this.states = new Deque();
    this.inputHistory = new Deque();
    this.my_id = args.my_id;
    this.map = args.map;
  }

  public start(): Promise<void> {
    display_map(this.stage, this.map);
    this.key_presses();
    return super.start();
  }

  protected timer(_prevStep?: number): void {
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
    if (!this.running) return;

    const message = deserializeSTC(data);

    if (this.my_id in message.inputAck) {
      this.inputHistory.discard_front_until(message.inputAck[this.my_id]);
    }

    const prevState = this.states.last_elem();
    const newState = message.state;

    this.update_player_sprites(prevState, newState);
    this.update_enemy_sprites(prevState, newState);

    this.states.reset(newState, message.stateNum);
  }

  update_player_sprites(prevState: State | undefined, newState: State): void {
    // spawn new players
    this.remove_entity_sprites(newState);
    for (const player of Object.values(newState.players)) {
      const weapon = newState.players[player.id].weapons[0];
      if (this.player_list[player.id] === undefined) {
        this.add_character(
          LOGICAL_TO_PIXELS(player.position.x),
          LOGICAL_TO_PIXELS(player.position.y),
          PLAYER_SIZE,
          PLAYER_SPRITE,
          player.id,
          weapon,
        );

        if (player.id === this.my_id) {
          this.my_sprite = this.player_list[this.my_id];
        }
      }

      this.decide_direction(prevState, newState, player.id);
      this.player_list[player.id].x = LOGICAL_TO_PIXELS(player.position.x);
      this.player_list[player.id].y = LOGICAL_TO_PIXELS(player.position.y);
      console.log(player.firing);
      if (player.firing == true) {
        this.player_list[player.id].shot_line.visible = false;
        this.stage.removeChild(this.player_list[player.id].shot_line);
        this.player_list[player.id].shot_line = this.add_shot_line(
          weapon,
          {
            x: LOGICAL_TO_PIXELS(player.position.x),
            y: LOGICAL_TO_PIXELS(player.position.y),
          },
          {
            x: LOGICAL_TO_PIXELS(player.target.x),
            y: LOGICAL_TO_PIXELS(player.target.y),
          },
        );

        this.player_list[player.id].shot_line.visible = true;
      } else if (this.player_list[player.id].shot_line.expires > 0) {
        this.player_list[player.id].shot_line.expires -= 1;
      } else {
        this.stage.removeChild(this.player_list[player.id].shot_line);
      }
    }
  }

  update_enemy_sprites(prevState: State | undefined, newState: State): void {
    this.remove_entity_sprites(newState);

    for (const enemy of Object.values(newState.enemies)) {
      if (this.enemy_list[enemy.id] === undefined) {
        this.add_enemy(
          LOGICAL_TO_PIXELS(enemy.position.x),
          LOGICAL_TO_PIXELS(enemy.position.y),
          ENEMY_SIZE,
          ENEMY_SPRITE,
          enemy.id,
        );
      }

      this.enemy_list[enemy.id].x = LOGICAL_TO_PIXELS(enemy.position.x);
      this.enemy_list[enemy.id].y = LOGICAL_TO_PIXELS(enemy.position.y);
    }
  }

  remove_entity_sprites(newState: State): void {
    for (const enemy_id in this.enemy_list) {
      if (newState.enemies[enemy_id] === undefined) {
        this.stage.removeChild(this.enemy_list[enemy_id]);
        delete this.enemy_list[enemy_id];
      }
    }
    for (const player_id in this.player_list) {
      console.log('danne');
      if (
        newState.players[player_id].alive === false &&
        this.player_list[player_id] !== undefined
      ) {
        console.log('agge', player_id);
        if (this.player_list[player_id].shot_line !== undefined) {
          this.stage.removeChild(this.player_list[player_id].shot_line);
        }
        this.stage.removeChild(this.player_list[player_id]);
        delete this.player_list[player_id];
      }
    }
  }

  decide_direction(
    prevState: State | undefined,
    newState: State,
    player_id: number,
  ): void {
    if (!prevState) return;
    const dx =
      newState.players[player_id].position.x -
      prevState.players[player_id].position.x;
    const dy =
      newState.players[player_id].position.y -
      prevState.players[player_id].position.y;
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
    target_width: number,
    img_filepath: string,
    id: number,
    weapon: Weapon,
  ): void {
    const character = load_zombie(img_filepath);

    const scale = target_width / character.width;

    character.position.set(x, y);
    character.id = id;
    character.scale.set(scale, scale);
    character.anchor.set(0.5, 0.5);
    this.player_list[id] = character;
    this.stage.addChild(character);
    character.show(character.animationStates.down);
    character.shot_line = this.add_shot_line(
      weapon,
      { x: x, y: y },
      { x: 0, y: 0 },
    );
  }

  add_enemy(
    x: number,
    y: number,
    target_width: number,
    img_filepath: string,
    id: number,
  ): void {
    const enemy = su.sprite(img_filepath);

    const scale = target_width / enemy.width;

    enemy.position.set(x, y);
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.id = id;
    enemy.scale.set(scale, scale);
    enemy.anchor.set(0.5, 0.5);
    this.enemy_list[id] = enemy;
    this.stage.addChild(enemy);
  }
  add_shot_line(
    weapon: Weapon,
    start: { x: number; y: number },
    stop: { x: number; y: number },
  ): PIXI.Graphics {
    const line = new PIXI.Graphics();
    line.lineStyle(weapon.projectile_width, weapon.projectile_color, 1);
    line.moveTo(stop.x, stop.y);
    line.lineTo(start.x, start.y);
    line.x = 0;
    line.y = 0;
    line.expires = 1;
    line.visible = true;
    this.stage.addChild(line);
    return line;
  }

  key_presses(): void {
    this.left = new Key('ArrowLeft');
    this.up = new Key('ArrowUp');
    this.right = new Key('ArrowRight');
    this.down = new Key('ArrowDown');
    this.fire = new Key(' '); //Spacebar
  }
}

function load_zombie(img_filepath): any {
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
