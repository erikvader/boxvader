//import Level from '../common/gameMap'; // alias to not conflict with a map collection
import { Id, Input } from '../common/misc';
import Simulation, { updatePlayerBodyFromInput } from '../common/simulation';
import { SERVER_FPS } from '../common/constants';
import GameMap from '../common/gameMap';
import { Vec2 } from 'planck-js';

export default class ServerSimulation extends Simulation {
  public difficulty: number;

  constructor(gameMap: GameMap, updateStep: number, enemyIdCounter: number) {
    super(gameMap, updateStep, enemyIdCounter);
    this.difficulty = 0;
  }

  public update(inputs: Map<Id, Input>): void {
    this.commonUpdate();
    // update players based on their inputs
    // TODO: handle 'fire' input

    for (const id in this.state.players) {
      const idNum = parseInt(id);
      const body = this.bodies.get(idNum)!;
      const input = inputs.get(idNum);

      updatePlayerBodyFromInput(body, input);
    }

    this.world.step(this.updateStep);

    super.updateState();
  }
}
