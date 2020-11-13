import GameLoop from '../common/game-loop';
import { Vec2 } from 'planck-js';

export default class ServerGame extends GameLoop {
  private positions: Map<number, Vec2>;
  private broadcast;

  // private sim: ServerSimulation;
  // private stateCur: State;
  // private statePrev: State;

  constructor(broadcast: (any) => void, players: Array<number>) {
    super(60, 60);
    this.broadcast = broadcast;
    this.positions = new Map();

    for (const p of players) {
      this.positions.set(p, new Vec2(200, 200));
    }
  }

  clientMsg(player_id: number, data: any): void {
    if (!this.running) return;
    const pos = this.positions.get(player_id);
    if (pos !== undefined) {
      pos.x = data['x'];
      pos.y = data['y'];
    }
  }

  doUpdate(): void {
    // TODO: figure out better way to send this. Flatten the list maybe
    this.broadcast(Array.from(this.positions.entries()));
  }

  afterUpdate(): void {
    return;
  }
}
