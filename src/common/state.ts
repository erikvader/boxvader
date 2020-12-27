import { Player, Enemy } from './entity';
import { NumMap, PopArray, arrayEq } from './misc';

export default class State {
  public players: NumMap<Player> = {};
  public enemies: NumMap<Enemy> = {};
  public wave = 1;
  public enemyIdCounter = 0;

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
    state.enemyIdCounter = this.enemyIdCounter;
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
    flat.push(this.enemyIdCounter);
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
    const enemyIdCounter = buf.pop();

    const state = new State();
    state.players = players;
    state.enemies = enemies;
    state.wave = wave;
    state.enemyIdCounter = enemyIdCounter;
    return state;
  }

  public isSimilarTo(other: State, tolerance: number): boolean {
    // NOTE: this.wave is only used to display a number on the screen. It is not
    // worth it to say that these two states are different solely because of
    // wave. Same with this.enemyIdCounter
    const myStuff = [
      ...Object.values(this.players),
      ...Object.values(this.enemies),
    ];
    const otherStuff = [
      ...Object.values(other.players),
      ...Object.values(other.enemies),
    ];

    if (myStuff.length !== otherStuff.length) return false;

    myStuff.sort((a, b) => a.id - b.id);
    otherStuff.sort((a, b) => a.id - b.id);

    return arrayEq(myStuff, otherStuff, (m, o) => m.isSimilarTo(o, tolerance));
  }
}
