export default abstract class Weapon {
  protected _attack_rate: number;
  protected _attack_damage: number;
  protected _projectile_color: number;
  protected _projectile_width: number;
  protected _timeOfLastShot: number = 0;

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
  public get timeOfLastShot(): number {
    return this._timeOfLastShot;
  }
  public set timeOfLastShot(time: number) {
    this._timeOfLastShot = time;
  }

  constructor(
    attack_rate: number,
    attack_damage: number,
    projectile_color: number,
    projectile_width: number,
  ) {
    this._attack_rate = 1 / attack_rate; // attacks per second
    this._attack_damage = attack_damage;
    this._projectile_color = projectile_color;
    this._projectile_width = projectile_width;
  }
}

/*
   Standard issue weapon used by imperial stormtroopers
   APS: 2
   Damage: 1
   Color: Red
   Projectile width: 2
*/
export class E11_blaster_rifle extends Weapon {
  public constructor() {
    super(2, 2, 0xf72331, 2);
  }
}
