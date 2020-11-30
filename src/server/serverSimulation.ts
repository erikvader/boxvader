import GameMap from '../common/gameMap';
import { Id, Input } from '../common/misc';
import Simulation, { updatePlayerBodyFromInput } from '../common/simulation';

export default class ServerSimulation extends Simulation {
  public difficulty: number;

  constructor(map: GameMap, updateStep: number, enemyIdCounter: number) {
    super(map, updateStep, enemyIdCounter);
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

    for (const enemy of Object.values(this.state.enemies)) {
      enemy.move();
    }

    this.world.step(this.updateStep);

    // TODO: update enemies with AI?

    // update our state
    super.updateState();
  }
}
