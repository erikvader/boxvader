import { Player, Enemy } from './entity';
import { isObjectWithKeys, NumMap } from './misc';

export default class State {
  public players: NumMap<Player> = {};
  public enemies: NumMap<Enemy> = {};

  public static revive(obj: unknown): State {
    if (isObjectWithKeys(obj, ['players', 'enemies'])) {
      const r = new State();
      for (const pid in obj['players']) {
        r.players[pid] = Player.revive(obj['players'][pid]);
      }

      for (const pid in obj['enemies']) {
        r.enemies[pid] = Enemy.revive(obj['enemies'][pid]);
      }
      return r;
    }
    throw new Error("couldn't revive State");
  }
}
