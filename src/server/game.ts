import GameLoop from '../common/game-loop';

import { Id, NumMap, Input } from '../common/misc';
import State from '../common/state';
import { Player } from '../common/entity';
import { serialize, deserializeCTS } from '../common/msg';
import ByteBuffer from 'bytebuffer';
import Deque from '../common/deque';

import { Vec2 } from 'planck-js';
import { decideDirection, directionToVelocity } from '../common/directions';

import * as constants from '../common/constants';

export default class ServerGame extends GameLoop {
  private state: State;
  private stateNum: number;
  private broadcast;
  // private sim: ServerSimulation;
  private playerInputs: NumMap<Deque<Input>>;
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
  }

  clientMsg(player_id: Id, data: any): void {
    if (!this.running) return;

    data = deserializeCTS(data);

    const pi = this.playerInputs[player_id]!;
    pi.merge_back(data.inputs); // TODO: check if pi and data.inputs are disjunct
    this.inputAcks[player_id] = pi.last;
  }

  doUpdate(): void {
    for (const p in this.state.players) {
      const pos = this.state.players[p].position;

      if (this.playerInputs[p].length > 0) {
        const inp = this.playerInputs[p].pop_front()[0];
        const direction = decideDirection(
          inp.up,
          inp.down,
          inp.right,
          inp.left,
        );
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
    return;
  }
}
