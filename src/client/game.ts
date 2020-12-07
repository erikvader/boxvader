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
import {
  PLAYER_SPRITE,
  LOGICAL_TO_PIXELS,
  PLAYER_SIZE,
  ENEMY_SIZE,
  ENEMY_SPRITE,
} from '../common/constants';
import { Vec2 } from 'planck-js';
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
    for (const player of Object.values(newState.players)) {
      if (this.player_list[player.id] === undefined) {
        this.add_character(
          LOGICAL_TO_PIXELS(player.position.x),
          LOGICAL_TO_PIXELS(player.position.y),
          PLAYER_SIZE,
          PLAYER_SPRITE,
          player.id,
        );

        if (player.id === this.my_id) {
          this.my_sprite = this.player_list[this.my_id];
        }
      }

      this.decide_direction(player, newState);
      this.player_list[player.id].x = LOGICAL_TO_PIXELS(player.position.x);
      this.player_list[player.id].y = LOGICAL_TO_PIXELS(player.position.y);
      if (player.firing == true) {
        this.player_list[player.id].shot_line.visible = false;
        this.stage.removeChild(this.player_list[player.id].shot_line);
        this.player_list[player.id].shot_line = this.add_shot_line(
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
      } else {
        this.player_list[player.id].shot_line.visible = false;
      }
    }
  }

  walking_animation(walking: boolean, player_id: number, walkAnimation, standAnimation): void {
    if (walking) {
      if (!(this.player_list[player_id].walk[0] == walkAnimation[0]) && !(this.player_list[player_id].walk[1] == walkAnimation[1])) {
        this.player_list[player_id].playAnimation(
          walkAnimation,
        );
        this.player_list[player_id].walk = walkAnimation;
      }
    } else {
      this.player_list[player_id].show(
        standAnimation
      );
      this.player_list[player_id].walk = false;
    }
  }
  update_enemy_sprites(prevState: State | undefined, newState: State): void {
    this.remove_enemy_sprites(newState);

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

  remove_enemy_sprites(newState: State): void {
    for (const enemy_id in this.enemy_list) {
      if (newState.enemies[enemy_id] === undefined) {
        this.stage.removeChild(this.enemy_list[enemy_id]);
        delete this.enemy_list[enemy_id];
      }
    }
  }

  decide_direction(player , newState: State): void {
    const pi = Math.PI;
    //Right
    if (player.direction.x === 1 && player.direction.y == 0) {
      this.walking_animation(player.walking, player.id, this.player_list[player.id].animationStates.walkRight, this.player_list[player.id].animationStates.right);
    }
    //Down
    if (player.direction.x === 0 && player.direction.y == 1) {
      this.walking_animation(player.walking, player.id, this.player_list[player.id].animationStates.walkDown, this.player_list[player.id].animationStates.down);
    }
    //Up
    if (player.direction.x === 0 && player.direction.y == -1) {
      this.walking_animation(player.walking, player.id, this.player_list[player.id].animationStates.walkUp, this.player_list[player.id].animationStates.up);
    }
    //Left
    if (player.direction.x === -1 && player.direction.y == 0) {
      this.walking_animation(player.walking, player.id, this.player_list[player.id].animationStates.walkLeft, this.player_list[player.id].animationStates.left);
    }
    //Right Up
    if (player.direction.x === 1 && player.direction.y == -1) {
      this.walking_animation(player.walking, player.id, this.player_list[player.id].animationStates.walkRightUp, this.player_list[player.id].animationStates.upRight);
    }
    //Right Down
    if (player.direction.x === 1 && player.direction.y == 1) {
      this.walking_animation(player.walking, player.id, this.player_list[player.id].animationStates.walkRightDown, this.player_list[player.id].animationStates.rightDown);
    }

    //Left Up
    if (player.direction.x === -1 && player.direction.y == -1) {
      this.walking_animation(player.walking, player.id, this.player_list[player.id].animationStates.walkLeftUp, this.player_list[player.id].animationStates.leftUp);
    }
    //Left Down
    if (player.direction.x === -1 && player.direction.y == 1) {
      this.walking_animation(player.walking, player.id, this.player_list[player.id].animationStates.walkLeftDown, this.player_list[player.id].animationStates.leftDown);
    }
  }

  add_character(
    x: number,
    y: number,
    target_width: number,
    img_filepath: string,
    id: number,
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
    character.shot_line = this.add_shot_line({ x: x, y: y }, { x: 0, y: 0 });
    this.add_health_bar(character, scale);
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
    this.add_health_bar(enemy, scale)
  }

  add_health_bar(sprite, scale) {
    //Create the health bar
    let width = 30;
    let height = 5;
    let flot_height = 20;
    let new_scale = 1/scale;
    let total_hp = new PIXI.Graphics();
    total_hp.lineStyle(0, 0x000000, 0);
    total_hp.beginFill(0xff3300);
    total_hp.drawRect(0, 0, new_scale*width, new_scale*height);
    total_hp.endFill();
    total_hp.x = -width*new_scale/2;
    total_hp.y = -flot_height*new_scale;
    sprite.addChild(total_hp);

    let hp = new PIXI.Graphics();
    hp.lineStyle(0, 0xff3300, 0);
    hp.beginFill(0x32CD32);
    hp.drawRect(0, 0, 10*new_scale, height*new_scale);
    hp.endFill();
    hp.x = 0;
    hp.y = 0;
    total_hp.addChild(hp);
    hp.width = 15*new_scale;
    console.log(total_hp.children[0]);
  }

  change_hp(sprite, max_hp, current_hp){
    let outerWidth = sprite.children[0].width
    let percent = current_hp/max_hp;
    sprite.children[0].children[0].width = outerWidth * percent;
  }
  
  add_shot_line(
    start: { x: number; y: number },
    stop: { x: number; y: number },
  ): PIXI.Graphics {
    const line = new PIXI.Graphics();
    line.lineStyle(4, 0xffffff, 1);
    line.moveTo(stop.x, stop.y);
    line.lineTo(start.x, start.y);
    line.x = 0;
    line.y = 0;
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
