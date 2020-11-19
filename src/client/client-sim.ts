import Level from '../common/map';
import { Input } from '../common/misc';
import Simulation, { updatePlayerBodyFromInput } from '../common/sim';
import State from '../common/state';
import { Body } from 'planck-js';

export default class ClientSimulation extends Simulation {
  constructor(map: Level, updateStep: number) {
    super(map, updateStep);
  }

  public update(body: Body, input: Input): void {
    updatePlayerBodyFromInput(body, input);
  }

  public reset(state: State): void {
    this._state = state.clone();

    this.bodies.forEach((body, id) => {
      if (id in this.state.players) {
        const player = this.state.players[id];
        body.setPosition(player.position.clone());
        body.setLinearVelocity(player.velocity.clone());
      } else if (id in this.state.enemies) {
        const enemy = this.state.enemies[id];
        body.setPosition(enemy.position.clone());
        body.setLinearVelocity(enemy.velocity.clone());
      } else {
        throw new Error(
          `Body with ID ${id} belongs to neither a player nor an enemy.`,
        );
      }
    });
  }
}
