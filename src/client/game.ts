import Key from './key';
import * as PIXI from 'pixi.js';
import GameLoop, { GameLoopOpt } from '../common/game-loop';
import ByteBuffer from 'bytebuffer';
import Deque from '../common/deque';
import { Input } from '../common/misc';
import { Player } from '../common/entity';
import * as CSP from './csp';

import { deserializeSTC, serialize } from '../common/msg';
import State from '../common/state';
import display_map from './renderMap';
import GameMap from '../common/gameMap';
import Weapon from '../common/weapon';
import * as constants from '../common/constants';
import { EnemySprite } from './sprites/enemySprite';
import { CustomSprite } from './sprites/customSprite';
import { CharacterAnimatedSprite } from './sprites/characterAnimatedSprite';

export interface ClientGameOpt extends GameLoopOpt {
  sendInputFun: (buf: ByteBuffer) => void;
  renderer: PIXI.Renderer;
  stage: PIXI.Container;
  map: GameMap;
  my_id: number;
  seed: string;
  numPlayers: number;
}

export default class ClientGame extends GameLoop {
  private renderer;
  private stage;
  private map;

  private predictor: CSP.Predictor;

  // inputs not confirmed by server
  private inputHistory: Deque<Input>;
  private lastSentInput: number;

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

  private score;
  private waveNumber;

  constructor(args: ClientGameOpt) {
    super(args);
    this.sendInputFun = args.sendInputFun;
    this.renderer = args.renderer;
    this.stage = args.stage;
    this.stage.sortableChildren = true;
    this.inputHistory = new Deque();
    this.lastSentInput = -1;
    this.my_id = args.my_id;
    this.map = args.map;

    if (constants.CLIENT.ENABLE_CSP) {
      this.predictor = new CSP.Smarty(
        this.map,
        args.numPlayers,
        args.seed,
        args.my_id,
      );
    } else {
      this.predictor = new CSP.Dummy();
    }
  }

  public start(): Promise<void> {
    display_map(this.stage, this.map);
    this.create_scoreboard();
    this.key_presses();
    return super.start();
  }

  protected timer(_prevStep?: number): void {
    window.requestAnimationFrame(() => {
      if (!this.running) return;
      this.update();
      this.timer();
    });
  }

  afterUpdate(): void {
    this.renderer.render(this.stage);

    if (this.inputHistory.last > this.lastSentInput) {
      this.inputHistory.trim_to(constants.CLIENT.MAX_INPUTS);
      this.sendInputFun(serialize({ inputs: this.inputHistory }));
      this.lastSentInput = this.inputHistory.last;
    }
  }

  doUpdate(): void {
    const inp: Input = {
      up: this.up.isDown,
      left: this.left.isDown,
      right: this.right.isDown,
      down: this.down.isDown,
      fire: this.fire.isDown,
    };

    this.inputHistory.push_back(inp);

    this.predictor.predict(this.inputHistory);
    const newState = this.predictor.state;
    const stateNum = this.predictor.stateNum;

    this.update_player_sprites(newState, stateNum);
    this.update_enemy_sprites(newState);
    this.update_scoreboard(newState);
  }

  protected cleanup(): void {
    this.renderer.destroy();
    this.stage.destroy({ children: true });
    this.left.unsubscribe();
    this.right.unsubscribe();
    this.down.unsubscribe();
    this.up.unsubscribe();
    this.fire.unsubscribe();
  }

  serverMsg(data: any): void {
    if (!this.running) return;
    const message = deserializeSTC(data);

    if (this.my_id in message.inputAck) {
      this.inputHistory.discard_front_until(message.inputAck[this.my_id]);
    }

    this.predictor.setTruth(message.state, message.stateNum, this.inputHistory);
  }

  update_player_sprites(newState: State, stateNum: number): void {
    // spawn new players
    this.remove_entity_sprites(newState);
    for (const player of Object.values(newState.players)) {
      const weapon = newState.players[player.id].weapons[0];
      if (this.player_list[player.id] === undefined) {
        this.add_character(
          constants.MAP.LOGICAL_TO_PIXELS(player.position.x),
          constants.MAP.LOGICAL_TO_PIXELS(player.position.y),
          constants.UI.PLAYER_SIZE,
          constants.UI.PLAYER_SPRITE_PATH,
          player.id,
          weapon,
        );

        if (player.id === this.my_id) {
          this.my_sprite = this.player_list[this.my_id];
        }
      }

      this.decide_direction(player);
      this.change_hp(
        this.player_list[player.id],
        player.maxHealth,
        player.health,
        true,
      );
      this.player_list[player.id].x = constants.MAP.LOGICAL_TO_PIXELS(
        player.position.x,
      );
      this.player_list[player.id].y = constants.MAP.LOGICAL_TO_PIXELS(
        player.position.y,
      );
      if (
        player.weapons[0].timeOfLastShot <
          stateNum + constants.SERVER.BROADCAST_RATE &&
        player.weapons[0].timeOfLastShot +
          player.weapons[0].projectileVisibiltyDuration >
          stateNum + constants.SERVER.BROADCAST_RATE
      ) {
        this.player_list[player.id].shot_line.visible = false;
        this.stage.removeChild(this.player_list[player.id].shot_line);
        this.player_list[player.id].shot_line = this.add_shot_line(
          weapon,
          {
            x: constants.MAP.LOGICAL_TO_PIXELS(player.position.x),
            y: constants.MAP.LOGICAL_TO_PIXELS(player.position.y),
          },
          {
            x: constants.MAP.LOGICAL_TO_PIXELS(player.target.x),
            y: constants.MAP.LOGICAL_TO_PIXELS(player.target.y),
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

  walking_animation(
    walking: boolean,
    player_id: number,
    walkAnimation,
    standAnimation,
  ): void {
    if (walking) {
      if (
        !(this.player_list[player_id].walk[0] == walkAnimation[0]) &&
        !(this.player_list[player_id].walk[1] == walkAnimation[1])
      ) {
        this.player_list[player_id].playAnimation(walkAnimation);
        this.player_list[player_id].walk = walkAnimation;
      }
    } else {
      this.player_list[player_id].show(standAnimation);
      this.player_list[player_id].walk = false;
    }
  }
  update_enemy_sprites(newState: State): void {
    this.remove_entity_sprites(newState);

    for (const enemy of Object.values(newState.enemies)) {
      if (this.enemy_list[enemy.id] === undefined) {
        this.add_enemy(
          constants.MAP.LOGICAL_TO_PIXELS(enemy.position.x),
          constants.MAP.LOGICAL_TO_PIXELS(enemy.position.y),
          constants.UI.ENEMY_SIZE,
          constants.UI.ENEMY_SPRITE_PATH,
          enemy.id,
        );
      }
      this.change_hp(
        this.enemy_list[enemy.id],
        enemy.maxHealth,
        enemy.health,
        false,
      );
      this.enemy_list[enemy.id].x = constants.MAP.LOGICAL_TO_PIXELS(
        enemy.position.x,
      );

      this.enemy_list[enemy.id].y = constants.MAP.LOGICAL_TO_PIXELS(
        enemy.position.y,
      );
    }
  }

  remove_entity_sprites(newState: State): void {
    for (const enemy_id in this.enemy_list) {
      if (newState.enemies[enemy_id] === undefined) {
        playSound('die', 0.1);
        this.add_blood_splatter(
          this.enemy_list[enemy_id].x,
          this.enemy_list[enemy_id].y,
        );
        this.stage.removeChild(this.enemy_list[enemy_id]);
        this.stage.removeChild(this.enemy_list[enemy_id].hpBar);
        delete this.enemy_list[enemy_id];
      }
    }

    for (const player_id in this.player_list) {
      if (!newState.players[player_id].alive) {
        this.add_blood_splatter(
          this.player_list[player_id].x,
          this.player_list[player_id].y,
        );

        this.player_list[player_id].hpBar.visible = false;

        this.player_list[player_id].visible = false;
        if (this.player_list[player_id].shot_line !== undefined) {
          this.player_list[player_id].shot_line.visible = false;
        }
      } else {
        if (this.player_list[player_id].visible === false) {
          this.player_list[player_id].visible = true;
          this.player_list[player_id].hpBar.visible = true;
        }
      }
    }
  }

  decide_direction(player: Player): void {
    const pi = Math.PI;
    const offset = 0;
    //Right
    if (player.direction.x === 1 && player.direction.y === 0) {
      this.player_list[player.id].rotation = offset + 0;
    }
    //Down
    if (player.direction.x === 0 && player.direction.y === 1) {
      this.player_list[player.id].rotation = offset + pi / 2;
    }
    //Up
    if (player.direction.x === 0 && player.direction.y === -1) {
      this.player_list[player.id].rotation = offset - pi / 2;
    }
    //Left
    if (player.direction.x === -1 && player.direction.y === 0) {
      this.player_list[player.id].rotation = offset + pi;
    }
    //Right Up
    if (player.direction.x === 1 && player.direction.y === -1) {
      this.player_list[player.id].rotation = offset - pi / 4;
    }
    //Right Down
    if (player.direction.x === 1 && player.direction.y === 1) {
      this.player_list[player.id].rotation = offset + pi / 4;
    }

    //Left Up
    if (player.direction.x === -1 && player.direction.y === -1) {
      this.player_list[player.id].rotation = offset - (3 * pi) / 4;
    }
    //Left Down
    if (player.direction.x === -1 && player.direction.y === 1) {
      this.player_list[player.id].rotation = offset + (3 * pi) / 4;
    }
    if (player.walking) {
      this.player_list[player.id].play();
    } else {
      this.player_list[player.id].stop();
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
    const character = new CharacterAnimatedSprite('imgs/stormtrooper.json', id);
    const scale = target_width / character.width;
    character.zIndex = 2;
    character.position.set(x, y);
    character.id = id;
    character.scale.set(scale, scale);
    character.anchor.set(0.5, 0.5);
    this.player_list[id] = character;
    this.stage.addChild(character);

    character.shot_line = this.add_shot_line(
      weapon,
      { x: x, y: y },
      { x: 0, y: 0 },
    );
    this.add_health_bar(character, scale);
  }
  add_blood_splatter(x: number, y: number): void {
    const splatter = Math.floor(Math.random() * 3) + 1;
    const blood = new PIXI.Sprite(
      PIXI.Loader.shared.resources[
        'imgs/blood/splatter' + splatter + '.png'
      ].texture,
    );
    blood.anchor.set(0.5, 0.5);
    blood.position.set(x, y);
    blood.zIndex = 0;
    this.stage.addChild(blood);
  }
  add_enemy(
    x: number,
    y: number,
    target_width: number,
    img_filepath: string,
    id: number,
  ): void {
    const enemy = new EnemySprite(
      PIXI.Loader.shared.resources[img_filepath].texture,
      id,
    );
    const scale = target_width / enemy.width;
    enemy.zIndex = 2;
    enemy.position.set(x, y);

    enemy.id = id;
    enemy.scale.set(scale, scale);
    enemy.anchor.set(0.5, 0.5);
    this.enemy_list[id] = enemy;
    this.stage.addChild(enemy);
    this.add_health_bar(enemy, scale);
  }

  add_health_bar(sprite: CustomSprite, scale: number): void {
    const width = constants.UI.HP_BAR_WIDTH;
    const height = constants.UI.HP_BAR_HEIGHT;
    const flot_height = constants.UI.HP_BAR_FLOAT;
    const total_hp = new PIXI.Graphics();
    total_hp.lineStyle(0, 0x000000, 0);
    total_hp.beginFill(0xff3300);
    total_hp.drawRect(0, 0, width, height);
    total_hp.endFill();
    total_hp.zIndex = 2;
    total_hp.x = sprite.x - width / 2;
    total_hp.y = sprite.y - flot_height;
    this.stage.addChild(total_hp);

    const hp = new PIXI.Graphics();
    hp.lineStyle(0, 0xff3300, 0);
    hp.beginFill(0x32cd32);
    hp.drawRect(0, 0, width, height);
    hp.endFill();
    hp.x = 0;
    hp.y = 0;
    total_hp.addChild(hp);
    sprite.hpBar = total_hp;
    hp.width = width;
  }

  change_hp(
    sprite: CustomSprite,
    max_hp: number,
    current_hp: number,
    isPlayer: boolean,
  ): void {
    if (sprite.hpBar === undefined) return;
    const width = constants.UI.HP_BAR_WIDTH;
    const flot_height = constants.UI.HP_BAR_FLOAT;
    const outerWidth = sprite.hpBar.width;
    const percent = current_hp / max_hp;
    sprite.hpBar.x = sprite.x + -width / 2;
    sprite.hpBar.y = sprite.y - flot_height;
    const oldHp = (sprite.hpBar.children[0] as PIXI.Graphics).width;
    const newHp = outerWidth * percent;
    if (isPlayer && newHp < oldHp) {
      playSound('huh', 0.1);
    }
    (sprite.hpBar.children[0] as PIXI.Graphics).width = outerWidth * percent;
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
    line.visible = true;
    this.stage.addChild(line);
    playSound('pew', 0.1);
    return line;
  }

  key_presses(): void {
    this.left = new Key('ArrowLeft');
    this.up = new Key('ArrowUp');
    this.right = new Key('ArrowRight');
    this.down = new Key('ArrowDown');
    this.fire = new Key(' '); //Spacebar
  }

  create_scoreboard(): void {
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 'white',
      stroke: '#ff3300',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6,
    });
    this.score = new PIXI.Text('Score: 0', style);
    this.stage.addChild(this.score);
    this.score.position.set(
      (this.map.width * constants.MAP.TILE_TARGET_SIZE_PIXELS -
        4 * constants.MAP.TILE_TARGET_SIZE_PIXELS) /
        2,
      constants.MAP.TILE_TARGET_SIZE_PIXELS * 1.2,
    );
    this.waveNumber = new PIXI.Text('Wave: 1', style);
    this.stage.addChild(this.waveNumber);
    this.waveNumber.position.set(
      (this.map.width * constants.MAP.TILE_TARGET_SIZE_PIXELS +
        2 * constants.MAP.TILE_TARGET_SIZE_PIXELS) /
        2,
      constants.MAP.TILE_TARGET_SIZE_PIXELS * 1.2,
    );
  }

  update_scoreboard(state: State): void {
    this.score.text = 'Score: ' + state.players[this.my_id]?.score;
    this.waveNumber.text = 'Wave: ' + state.wave;
  }
}
function playSound(soundId: string, volume: number): void {
  const sound = PIXI.Loader.shared.resources[soundId].sound;
  sound.volume = volume;
  sound.play();
}
