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

  public update(inputs: Map<Id, Input>) {
    // update players based on their inputs
    // TODO: handle 'fire' input

    for (const [id, player] of Object.values(this.state.players)) {
      const body = this.bodies.get(id)!;
      const input = inputs.get(id);
      updatePlayerBodyFromInput(body, input);
    }

    this.world.step(this.updateStep);

    // TODO: update enemies with AI?

    // update our state
    super.updateState();
  }
}
