import { Id, Input } from '../common/misc';
import Simulation from '../common/simulation';
import GameMap from '../common/gameMap';

export default class ServerSimulation extends Simulation {
  public difficulty: number;

  constructor(gameMap: GameMap, updateStep: number, numPlayers: number) {
    super(gameMap, updateStep, numPlayers);
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
      this.handlePlayerInput(body, this.state.players[idNum], input);
    }

    this.world.step(this.updateStep);

    super.updateState();
  }
}
