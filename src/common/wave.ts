export default class Wave {
  /** The ordinal number of this wave. */
  public readonly waveNumber: number;
  /** The health of enemies in this wave. */
  public readonly enemyHealth: number;

  /** The number of enemies remaining to be spawned. */
  private _unspawned: number;
  /** The number of enemies currently alive in this wave. */
  public _alive: number;

  /** Is this wave finished? */
  public get finished(): boolean {
    return this._unspawned <= 0 && this.alive <= 0;
  }

  /** How many enemies in this wave are currently alive? */
  public get alive(): number {
    return this._alive;
  }

  /** How many enemies are yet to be spawned? */
  public get unspawned(): number {
    return this._unspawned;
  }

  constructor(waveNumber: number, numEnemies: number, enemyHealth: number) {
    this.waveNumber = waveNumber;
    this.enemyHealth = enemyHealth;
    this._unspawned = numEnemies;
    this._alive = 0;
  }

  /** Mark a single enemy in this wave as spawned. */
  public spawnSingle(): void {
    this._unspawned = Math.max(this._unspawned - 1, 0);
    this._alive += 1;
  }

  /** Mark `amount` enemies in this wave as killed. */
  public kill(amount: number): void {
    this._alive = Math.max(this.alive - amount, 0);
  }
}
