import GameLoop from '../common/game-loop';

import { Id, NumMap, Input } from '../common/misc';
import State from '../common/state';
import { Player, Enemy } from '../common/entity';
import { serialize, deserializeCTS } from '../common/msg';
import ByteBuffer from 'bytebuffer';
import Deque from '../common/deque';

import { Vec2 } from 'planck-js';
import { decideDirection, directionToVelocity } from '../common/directions';

import * as constants from '../common/constants';

/**
 * [[Input]], but it also remembers on which [[ServerGame.stateNum]] it was
 * added on.
 */
interface TimedInput extends Input {
  stateNum: number;
}

export default class ServerGame extends GameLoop {
  private state: State;
  private stateNum: number;
  private broadcast;
  // private sim: ServerSimulation;
  private enemyIdCounter: number;
  private playerInputs: NumMap<Deque<TimedInput>>;
  private inputAcks: NumMap<number>;

  constructor(broadcast: (buf: ByteBuffer) => void, players: Array<Id>) {
    super({ ups: constants.SERVER_UPS, fps: constants.SERVER_FPS });
    this.broadcast = broadcast;
    this.state = new State();
    this.stateNum = 0;
    this.playerInputs = {};
    this.inputAcks = {};

    for (const p of players) {
      this.state.players[p] = new Player(
        p,
        new Vec2(0, 0),
        100,
        new Vec2(200, 200),
        'Agge',
      );

      this.playerInputs[p] = new Deque();
    }
    this.enemyIdCounter = players.length;
  }

  private moveEnemies(): void {
    for (const enemy of Object.values(this.state.enemies)) {
      enemy.move();
    }
  }

  //spawns in a fixed location, should probably have a vec2 array as input for location
  // Should probably have a type of enemy as well for later
  private spawnEnemies(): void {
    this.state.enemies[this.enemyIdCounter] = new Enemy(
      this.enemyIdCounter,
      new Vec2(0, 0),
      100,
      Vec2(this.enemyIdCounter * 4, 0),
    );
    this.enemyIdCounter += 1;
  }
  // despawns with a weird criteria atm, but is easily changed
  private despawnEnemies(): void {
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

    const pi = this.playerInputs[player_id]!;
    const newInputs = data.inputs.map_mut(i => {
      const j = i as TimedInput;
      j.stateNum = this.stateNum;
      return j;
    });
    pi.merge_back(newInputs); // TODO: check if pi and data.inputs are disjunct
    this.inputAcks[player_id] = pi.last;

    this.moveEnemies();
  }

  doUpdate(): void {
    for (const p in this.state.players) {
      const inp = this.getNextInput(p);
      if (inp !== undefined) {
        const direction = decideDirection(
          inp.up,
          inp.down,
          inp.right,
          inp.left,
        );
        const pos = this.state.players[p].position;
        const vel = directionToVelocity(direction);
        pos.x += constants.MOVEMENT_SPEED * vel[0];
        pos.y += constants.MOVEMENT_SPEED * vel[1];
      }
    }

    if (this.stateNum % constants.SERVER_BROADCAST_RATE === 0) {
      this.broadcast(
        serialize({
          inputAck: this.inputAcks,
          stateNum: this.stateNum,
          state: this.state,
        }),
      );
    }
    this.stateNum += 1;
  }

  afterUpdate(): void {
    //spawns a baby yoda per second
    if (this.stepCount % Math.floor(1000 / this.fps) === 0) {
      this.spawnEnemies();
      this.despawnEnemies();
    }
    return;
  }

  private getNextInput(p: string): TimedInput {
    const pi = this.playerInputs[p];
    let inp;
    while (pi.length > 0) {
      inp = pi.pop_front()[0];
      if (
        pi.length === 0 ||
        !this.isOld(inp.stateNum) ||
        this.isOld(pi.last_elem()!.stateNum)
      ) {
        break;
      }
    }
    return inp;
  }

  private isOld(stateNum): boolean {
    return this.stateNum - stateNum >= constants.INPUT_QUEUE_MAX_AGE;
  }
}
