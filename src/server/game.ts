import GameLoop from '../common/game-loop';
import { Vec2, Velocity } from 'planck-js';
import { decideDirection, directionToVelocity } from '../common/directions';
export default class ServerGame extends GameLoop {
  private positions: Map<number, Vec2>;
  private broadcast;
  private movementSpeed = 3; //Move this somewhere good.
  // private sim: ServerSimulation;
  // private stateCur: State;
  // private statePrev: State;

  constructor(broadcast: (any) => void, players: Array<number>) {
    super({ ups: 60, fps: 60 });
    this.broadcast = broadcast;
    this.positions = new Map();

    for (const p of players) {
      this.positions.set(p, new Vec2(200, 200));
    }
  }

  clientMsg(player_id: number, data: any): void {
    if (!this.running) return;
    const pos = this.positions.get(player_id);
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
    this.broadcast(Array.from(this.positions.entries()));
  }

  afterUpdate(): void {
    return;
  }
}
