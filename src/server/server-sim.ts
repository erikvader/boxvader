import { Body } from 'planck-js';
import { Player } from '../common/entity';
import Level from '../common/map'; // alias to not conflict with a map collection
import { Id, Input } from '../common/misc';
import Simulation from '../common/sim';

export default class ServerSimulation extends Simulation {
  public difficulty: number;

  constructor(map: Level, updateStep: number) {
    super(map, updateStep);
    this.difficulty = 0;
  }

  public update(inputs: Map<Id, Input>) {
    // update players based on their inputs
    // TODO: handle 'fire' input
    inputs.forEach((input, id) => {
      const player: Player = this._state[id];
      const body = this.bodies.get(id);

      if (!(player instanceof Player))
        throw new Error(`No player with ID ${id} exists.`);

      if (!(body instanceof Body))
        throw new Error(`No body belonging ID ${id} exists.`);

      // we move a player by simply increasing or decreasing its velocity in the cardinal directions

      const MOVE_FORCE_STRENGTH = 10;
      const velocity = body.getLinearVelocity();

      if (input.up && !input.down) velocity.y -= MOVE_FORCE_STRENGTH;
      else if (input.down && !input.up) velocity.y += MOVE_FORCE_STRENGTH;

      if (input.left && !input.right) velocity.x -= MOVE_FORCE_STRENGTH;
      else if (input.right && !input.left) velocity.x += MOVE_FORCE_STRENGTH;

      body.setLinearVelocity(velocity);
      body.setAwake(true);
    });

    // TODO: update enemies with AI?

    // update our state
    super.updateState();
  }
}
