import Deque from '../common/deque';
import { Input, Id } from '../common/misc';
import State from '../common/state';
import constants from '../common/constants';
import ClientSimulation from './clientSimulation';
import GameMap from '../common/gameMap';

export interface Predictor {
  predict(inputs: Deque<Input>): void;
  setTruth(state: State, inputs: Deque<Input>): void;
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
  public predict(inputs: Deque<Input>): void {
    inputs;
  }

  public setTruth(state: State, inputs: Deque<Input>): void {
    this.state = state;
    this.stateNum = inputs.first - 1;
  }
}

export class Smarty implements Predictor {
  // predicted states where the first one always is a `true` state from the
  // server.
  private states: Deque<State>;
  private sim: ClientSimulation;
  private my_id: number;

  // TODO: handle rngState properly
  private readonly rngState;

  constructor(map: GameMap, numPlayers: number, seed: string, my_id: Id) {
    this.my_id = my_id;
    this.states = new Deque();
    this.sim = new ClientSimulation(
      map,
      1 / constants.CLIENT.UPS,
      numPlayers,
      seed,
    );

    const snap = this.sim.snapshot();
    this.states.push_back(snap.state);
    this.rngState = snap.rngState;
  }

  public get state(): State {
    const last = this.states.last_elem();
    if (last === undefined) throw new Error("this can't be empty");
    return last;
  }

  public get stateNum(): number {
    return this.states.last;
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
      this.states.push_back(this.sim.snapshot().state);
    }
  }

  public setTruth(state: State, inputs: Deque<Input>): void {
    this.states.discard_front_until(inputs.first - 2);

    const first = this.states.first_elem();
    if (
      first !== undefined &&
      first.isSimilarTo(state, constants.GAME.TOLERANCE)
    ) {
      return;
    }

    this.states.reset(state, inputs.first - 1);
    this.sim.reset({ rngState: this.rngState, state: this.state });
    for (const inp of inputs) {
      this.sim.update(this.my_id, inp);
      this.states.push_back(this.sim.snapshot().state);
    }
  }

  // TODO: disable when production
  // private checkInvariants(): void {
  //   if (this.inputs.length > 0 && this.states.first !== this.inputs.first)
  //     console.error(
  //       'the values of first are incorrect',
  //       this.inputs.length,
  //       this.inputs.first,
  //       this.states.first,
  //     );

  //   if (this.inputs.length === 0 && this.states.length !== 1)
  //     console.error(
  //       'inputs is empty but states is long',
  //       this.inputs.length,
  //       this.states.length,
  //     );

  //   if (this.states.length !== this.inputs.length + 1)
  //     console.error(
  //       'the lengths are incorrect',
  //       this.states.length,
  //       this.inputs.length,
  //     );
  // }
}
