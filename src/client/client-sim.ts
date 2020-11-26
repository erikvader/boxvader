import Level from '../common/map';
import { Input } from '../common/misc';
import Simulation, {
  createBody,
  updatePlayerBodyFromInput,
} from '../common/sim';
import State from '../common/state';
import { Body } from 'planck-js';

export default class ClientSimulation extends Simulation {
  constructor(map: Level, updateStep: number, enemyIdCounter: number) {
    super(map, updateStep, enemyIdCounter);
  }

  public update(body: Body, input: Input): void {
    this.commonUpdate();
    updatePlayerBodyFromInput(body, input);
  }

  public reset(state: State): void {
    const newPlayerIds = new Array<string>();
    for (const id in state.players)
      if (!(id in this.state.players)) newPlayerIds.push(id);

    const newEnemyIds = new Array<string>();
    for (const id in state.enemies)
      if (!(id in this.state.enemies)) newEnemyIds.push(id);

    const deletedIds = new Array<number>();
    this.bodies.forEach((body, id) => {
      if (id in state.players) {
        const player = state.players[id];
        body.setPosition(player.position.clone());
        body.setLinearVelocity(player.velocity.clone());
      } else if (id in state.enemies) {
        const enemy = state.enemies[id];
        body.setPosition(enemy.position.clone());
        body.setLinearVelocity(enemy.velocity.clone());
      } else {
        deletedIds.push(id);
      }
    });

    for (const id of deletedIds) {
      const body = this.bodies.get(id);
      if (body) this.world.destroyBody(body);
      this.bodies.delete(id);
    }

    for (const id of newPlayerIds) {
      const body = createBody(this.world, state.players[id]);
      this.bodies.set(parseInt(id), body);
    }

    for (const id of newEnemyIds) {
      const body = createBody(this.world, state.enemies[id]);
      this.bodies.set(parseInt(id), body);
    }

    this._state = state.clone();
  }
}
