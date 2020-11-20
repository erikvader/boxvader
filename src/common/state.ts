import { Player, Enemy } from './entity';
import { isObjectWithKeys } from './misc';

export interface IdMap<T> {
  [id: number]: T;
}

export default class State {
  public players: IdMap<Player> = {};
  public enemies: IdMap<Enemy> = {};
  public dead_enemies: number[] = [];

  public static revive(obj: unknown): State {
    if (isObjectWithKeys(obj, ['players', 'enemies', 'dead_enemies'])) {
      const r = new State();
      for (const pid in obj['players']) {
        r.players[pid] = Player.revive(obj['players'][pid]);
      }

      for (const pid in obj['enemies']) {
        r.enemies[pid] = Enemy.revive(obj['enemies'][pid]);
      }

      for (const pid in obj['dead_enemies']) {
        r.dead_enemies[pid] = obj['dead_enemies'][pid];
      }
      return r;
    }
    throw new Error("couldn't revive State");
  }
}
