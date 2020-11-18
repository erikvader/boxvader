import GameLoop from '../common/game-loop';

import { Id } from '../common/misc';
import State from '../common/state';
import { Player } from '../common/entity';
import pson from '../common/pson';
import { serialize, deserializeCTS } from '../common/msg';

import { Vec2, Velocity } from 'planck-js';
import { decideDirection, directionToVelocity } from '../common/directions';

import { MOVEMENT_SPEED, FPS, UPS } from '../common/constants';

export default class ServerGame extends GameLoop {
  private state: State;
  private broadcast;
  private movementSpeed = MOVEMENT_SPEED; //Move this somewhere good.
  // private sim: ServerSimulation;
  // private stateCur: State;
  // private statePrev: State;

  constructor(broadcast: (any) => void, players: Array<Id>) {
    super({ ups: UPS, fps: FPS });
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
  }

  doUpdate(): void {
    // TODO: figure out better way to send this. Flatten the list maybe
    this.broadcast(serialize({ ackNum: 0, state: this.state }));
  }

  afterUpdate(): void {
    return;
  }
}
