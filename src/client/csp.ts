import Deque from '../common/deque';
import { Input } from '../common/misc';
import State from '../common/state';
import constants from '../common/constants';
import ClientSimulation from './clientSimulation';
import GameMap from '../common/gameMap';

export default class CSP {
  // predicted states where the first one always is a `true` state from the
  // server.
  private states: Deque<State>;
  // inputs that caused all states in `states`.
  // private statesInputs: Deque<Input>
  private sim: ClientSimulation;

  constructor(map: GameMap, numPlayers: number, seed: string) {
    this.states = new Deque();
    this.sim = new ClientSimulation(
      map,
      1 / constants.CLIENT.UPS,
      numPlayers,
      seed,
    );
    this.states.push_back(this.sim.state);
  }

  public get state(): State {
    const last = this.states.last_elem();
    if (last === undefined) throw new Error("this can't be empty");
    return last;
  }

  public get stateNum(): number {
    return this.states.last;
  }

  public predict(input: Input): void {
    1 + 1;
  }

  public setTruth(state: State, stateNum: number): void {
    this.states.reset(state, stateNum);
  }
}
