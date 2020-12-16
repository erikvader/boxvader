import { Player, Enemy } from './entity';
import { NumMap, PopArray } from './misc';

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

  public flatten(flat: number[]): void {
    const players = Object.values(this.players);
    flat.push(players.length);
    for (const p of players) {
      p.flatten(flat);
    }

    const enemies = Object.values(this.enemies);
    flat.push(enemies.length);
    for (const e of enemies) {
      e.flatten(flat);
    }

    flat.push(this.wave);
  }

  public static explode(buf: PopArray): State {
    const numPlayers = buf.pop();
    const players = {};
    for (let i = 0; i < numPlayers; i++) {
      const p = Player.explode(buf);
      players[p.id] = p;
    }

    const numEnemies = buf.pop();
    const enemies = {};
    for (let i = 0; i < numEnemies; i++) {
      const e = Enemy.explode(buf);
      enemies[e.id] = e;
    }

    const wave = buf.pop();

    const state = new State();
    state.players = players;
    state.enemies = enemies;
    state.wave = wave;
    return state;
  }
}
