import { Body } from 'planck-js';
import { Player } from '../common/entity';
import Level from '../common/map'; // alias to not conflict with a map collection
import { Id, Input } from '../common/misc';
import Simulation, { updatePlayerBodyFromInput } from '../common/sim';

export default class ServerSimulation extends Simulation {
  public difficulty: number;

  constructor(map: Level, updateStep: number) {
    super(map, updateStep);
    this.difficulty = 0;
  }

  public update(inputs: Map<Id, Input>): void {
    // update players based on their inputs
    // TODO: handle 'fire' input
    inputs.forEach((input, id) => {
      const player: Player = this._state[id];
      const body = this.bodies.get(id);

      if (!(player instanceof Player))
        throw new Error(`No player with ID ${id} exists.`);

      if (!(body instanceof Body))
        throw new Error(`No body belonging ID ${id} exists.`);

      updatePlayerBodyFromInput(body, input);
    });

    // TODO: update enemies with AI?

    // update our state
    super.updateState();
  }
}
