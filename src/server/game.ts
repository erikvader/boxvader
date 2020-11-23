import GameLoop from '../common/game-loop';

import { Id } from '../common/misc';
import State from '../common/state';
import { Player, Enemy } from '../common/entity';
import pson from '../common/pson';
import { serialize, deserializeCTS } from '../common/msg';

import { Vec2, Velocity } from 'planck-js';
import { decideDirection, directionToVelocity } from '../common/directions';

import { MOVEMENT_SPEED, SERVER_FPS, SERVER_UPS } from '../common/constants';

export default class ServerGame extends GameLoop {
  private state: State;
  private broadcast;
  private movementSpeed = MOVEMENT_SPEED; //Move this somewhere good.
  // private sim: ServerSimulation;
  // private stateCur: State;
  // private statePrev: State;
  private enemyIdCounter: number;

  constructor(broadcast: (any) => void, players: Array<Id>) {
    super({ ups: SERVER_UPS, fps: SERVER_FPS });
    this.broadcast = broadcast;
    this.state = new State();

    for (const p of players) {
      this.state.players[p] = new Player(
        p,
        new Vec2(0, 0),
        100,
        new Vec2(200, 200),
        'Agge',
      );
    }
    this.enemyIdCounter = players.length;
  }

  private moveEnemies() {
    for (const enemy of Object.values(this.state.enemies)) {
      enemy.move();
    }
  }

  //spawns in a fixed location, should probably have a vec2 array as input for location
  // Should probably have a type of enemy as well for later
  private spawnEnemies() {
    this.state.enemies[this.enemyIdCounter] = new Enemy(
      this.enemyIdCounter,
      new Vec2(0, 0),
      100,
      Vec2(this.enemyIdCounter * 4, 0),
    );
    this.enemyIdCounter += 1;
  }
  // despawns with a weird criteria atm, but is easily changed
  private despawnEnemies() {
    for (const enemy of Object.values(this.state.enemies)) {
      if (
        enemy.position.x < 0 ||
        enemy.position.x > 250 ||
        enemy.position.y < 0 ||
        enemy.position.y > 250
      ) {
        delete this.state.enemies[enemy.id];
      }
    }
  }

  clientMsg(player_id: Id, data: any): void {
    if (!this.running) return;

    data = deserializeCTS(data);

    const pos = this.state.players[player_id]?.position;

    const direction = decideDirection(
      data['inputs']['up'],
      data['inputs']['down'],
      data['inputs']['right'],
      data['inputs']['left'],
    );
    const vel = directionToVelocity(direction);

    if (pos !== undefined) {
      pos.x = pos.x + this.movementSpeed * vel[0];
      pos.y = pos.y + this.movementSpeed * vel[1];
    }
    this.moveEnemies();
  }

  doUpdate(): void {
    // TODO: figure out better way to send this. Flatten the list maybe
    this.broadcast(serialize({ ackNum: 0, state: this.state }));
  }

  afterUpdate(): void {
    //spawns a baby yoda per second
    if (this.stepCount % Math.floor(1000 / this.fps) === 0) {
      this.spawnEnemies();
      this.despawnEnemies();
    }
    return;
  }
}
