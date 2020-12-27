import Deque from '../common/deque';
import { Input, Id } from '../common/misc';
import State from '../common/state';
import constants from '../common/constants';
import ClientSimulation, { SimState } from './clientSimulation';
import GameMap from '../common/gameMap';

export interface Predictor {
  predict(inputs: Deque<Input>): void;
  setTruth(state: State, stateNum: number, inputs: Deque<Input>): void;
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

  public predict(_inputs: Deque<Input>): void {
    return;
  }

  public setTruth(state: State, stateNum: number, _inputs: Deque<Input>): void {
    this.state = state;
    this.stateNum = stateNum;
  }
}

export class Smarty implements Predictor {
  // predicted states where the first one always is a `true` state from the
  // server.
  private states: Deque<SimState>;
  private sim: ClientSimulation;
  private my_id: number;
  private truthStateNum;

  constructor(map: GameMap, numPlayers: number, seed: string, my_id: Id) {
    this.my_id = my_id;
    this.states = new Deque();
    this.sim = new ClientSimulation(
      map,
      1 / constants.CLIENT.UPS,
      numPlayers,
      seed,
    );
    this.states.push_back(this.sim.snapshot());
    this.truthStateNum = this.states.last;
  }

  public get state(): State {
    const last = this.states.last_elem();
    if (last === undefined) throw new Error("this can't be empty");
    return last.state;
  }

  public get stateNum(): number {
    return this.sim.stepCounter;
  }

  public predict(inputs: Deque<Input>): void {
    if (inputs.length === 0) return;
    if (inputs.first > this.states.last) {
      console.warn("inputs got truncated or something, can't do CSP");
      return;
    }

    for (let i = this.states.last; i <= inputs.last; i++) {
      const input = inputs.retrieve(i);
      if (input === undefined) break;
      this.sim.update(this.my_id, input);
      this.states.push_back(this.sim.snapshot());
    }
  }

  public setTruth(state: State, stateNum: number, inputs: Deque<Input>): void {
    if (stateNum <= this.truthStateNum) return;
    this.truthStateNum = stateNum;
    this.states.discard_front_until(inputs.first - 2);

    const first = this.states.first_elem();
    if (first !== undefined)
      state.translateTimestamps(first.stepCounter - stateNum);
    if (
      first !== undefined &&
      first.state.isSimilarTo(state, constants.GAME.TOLERANCE)
    ) {
      return;
    }

    const prev = this.states.retrieve(inputs.first - 1) ?? this.sim.snapshot();
    prev.state = state;

    this.states.reset(prev, inputs.first - 1);
    this.sim.reset(prev);
    for (const inp of inputs) {
      this.sim.update(this.my_id, inp);
      this.states.push_back(this.sim.snapshot());
    }
  }
}
