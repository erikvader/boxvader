import Deque from '../common/deque';
import { Input, Id } from '../common/misc';
import State from '../common/state';
import constants from '../common/constants';
import ClientSimulation, { SimState } from './clientSimulation';
import GameMap from '../common/gameMap';

export interface Predictor {
  predict(input: Input): void;
  setTruth(state: State, stateNum: number): void;
  stateNum: number;
  state: State;
}

export class Dummy implements Predictor {
  public state;
  public stateNum;

  constructor() {
    this.stateNum = 0;
    this.state = new State();
  }
  public predict(input: Input): void {
    input;
  }

  public setTruth(state: State, stateNum: number): void {
    this.state = state;
    this.stateNum = stateNum;
  }
}

export class Smarty implements Predictor {
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
