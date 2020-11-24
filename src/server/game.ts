import GameLoop from '../common/game-loop';

import { Id, NumMap, Input } from '../common/misc';
import State from '../common/state';
import { Player, Enemy } from '../common/entity';
import { serialize, deserializeCTS } from '../common/msg';
import ByteBuffer from 'bytebuffer';
import Deque from '../common/deque';

import { Vec2 } from 'planck-js';
import { decideDirection, directionToVelocity } from '../common/directions';

import { MOVEMENT_SPEED, SERVER_FPS, SERVER_UPS } from '../common/constants';

export default class ServerGame extends GameLoop {
  private state: State;
  private stateNum: number;
  private broadcast;
  // private sim: ServerSimulation;

  // private stateCur: State;
  // private statePrev: State;
  private enemyIdCounter: number;

  private playerInputs: NumMap<Deque<Input>>;

  constructor(broadcast: (buf: ByteBuffer) => void, players: Array<Id>) {
    super({ ups: SERVER_UPS, fps: SERVER_FPS });
    this.broadcast = broadcast;
    this.state = new State();
    this.stateNum = 0;
    this.playerInputs = {};

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

    if (!this.playerInputs[player_id]?.merge_back(data.inputs)) {
      console.error('There was a gap in the inputs, or the player disappeared');
    }
    this.moveEnemies();
  }

  doUpdate(): void {
    const inputAcks = {};

    for (const p in this.state.players) {
      const pos = this.state.players[p].position;

      if (this.playerInputs[p].length > 0) {
        const [inp, ack] = this.playerInputs[p].pop_front();
        inputAcks[p] = ack;
        const direction = decideDirection(
          inp.up,
          inp.down,
          inp.right,
          inp.left,
        );
        const vel = directionToVelocity(direction);
        pos.x += MOVEMENT_SPEED * vel[0];
        pos.y += MOVEMENT_SPEED * vel[1];
      }
    }

    this.broadcast(
      serialize({
        inputAck: inputAcks,
        stateNum: this.stateNum,
        state: this.state,
      }),
    );
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
}
