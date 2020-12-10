import { Player, Enemy } from './entity';
import { isObjectWithKeys, NumMap } from './misc';

export default class State {
  public players: NumMap<Player> = {};
  public enemies: NumMap<Enemy> = {};
  public wave = 1;

  /**
   * Returns a deep copy of this `State`.
   */
  public clone(): State {
    const state = new State();

    for (const id in this.players) {
      state.players[id] = this.players[id].clone();
    }

    for (const id in this.enemies) {
      state.enemies[id] = this.enemies[id].clone();
    }
    state.wave = this.wave;
    return state;
  }

  public static revive(obj: unknown): State {
    if (isObjectWithKeys(obj, ['players', 'enemies', 'wave'])) {
      const r = new State();
      for (const pid in obj['players']) {
        r.players[pid] = Player.revive(obj['players'][pid]);
      }

      for (const pid in obj['enemies']) {
        r.enemies[pid] = Enemy.revive(obj['enemies'][pid]);
      }

      r.wave = obj['wave'];
      return r;
    }
    throw new Error("couldn't revive State");
  }
}
