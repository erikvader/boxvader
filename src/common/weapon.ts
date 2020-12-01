export default abstract class Weapon {
  protected _attack_rate: number;
  protected _attack_damage: number;
  protected _projectile_color: number;
  protected _projectile_width: number;

  public get attack_rate(): number {
    return this._attack_rate;
  }
  public get attack_damage(): number {
    return this._attack_damage;
  }
  public get projectile_color(): number {
    return this._projectile_color;
  }
  public get projectile_width(): number {
    return this._projectile_width;
  }

  constructor(
    attack_rate: number,
    attack_damage: number,
    projectile_color: number,
    projectile_width: number,
  ) {
    this._attack_rate = attack_rate;
    this._attack_damage = attack_damage;
    this._projectile_color = projectile_color;
    this._projectile_width = projectile_width;
  }
}
//standard issue weapon used by imperial stormtroopers
export class E11_blaster_rifle extends Weapon {
  public constructor() {
    super(1, 1, 0xf72331, 2);
  }
}
