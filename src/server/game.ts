import GameLoop from '../common/game-loop';
import { Vec2 } from 'planck-js';
import { Id } from '../common/misc';
import State from '../common/state';
import { Player } from '../common/entity';
import pson from '../common/pson';
import { serialize } from '../common/msg';
export default class ServerGame extends GameLoop {
  private state: State;
  private broadcast;

  // private sim: ServerSimulation;
  // private stateCur: State;
  // private statePrev: State;

  constructor(broadcast: (any) => void, players: Array<Id>) {
    super({ ups: 60, fps: 60 });
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
    data = pson.decode(data);
    const pos = this.state.players[player_id]?.position;
    if (pos !== undefined) {
      pos.x = data['x'];
      pos.y = data['y'];
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
