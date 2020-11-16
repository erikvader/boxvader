import { Player, Enemy } from './entity';
import { Id } from './misc';

export interface IdMap<T> {
  [id: number]: T;
}

export default class State {
  public players: IdMap<Player> = {};
  public enemies: IdMap<Enemy> = {};
}
