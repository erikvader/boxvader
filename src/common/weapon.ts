import { isObjectWithKeys } from './misc';

export abstract class Weapon {
  protected _attack_rate: number;
  protected _attack_damage: number;
  protected _projectile_color: number;
  protected _projectile_width: number;
  protected _timeOfLastShot: number;
  protected _weaponType: string;

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
  public get weaponType(): string {
    return this._weaponType;
  }

  constructor(
    weaponType: string,
    attack_rate: number,
    attack_damage: number,
    projectile_color: number,
    projectile_width: number,
  ) {
    this._weaponType = weaponType;
    this._attack_rate = 1 / attack_rate; // attacks per second
    this._attack_damage = attack_damage;
    this._projectile_color = projectile_color;
    this._projectile_width = projectile_width;

    this._timeOfLastShot = 0;
  }

  public static revive(obj: unknown, construct: () => Weapon): Weapon {
    if (
      isObjectWithKeys(obj, [
        '_weaponType',
        '_attack_damage',
        '_attack_rate',
        '_projectile_color',
        '_projectile_width',
        '_timeOfLastShot',
      ])
    ) {
      const weapon = construct();
      weapon._weaponType = obj['_weaponType'];
      weapon._timeOfLastShot = obj['_timeOfLastShot'];
      weapon._attack_damage = obj['_attack_damage'];
      weapon._attack_rate = obj['_attack_rate'];
      weapon._projectile_color = obj['_projectile_color'];
      weapon._projectile_width = obj['_projectile_width'];
      return weapon;
    }
    throw new Error("couldn't revive Weapon");
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
    super('E11_blaster_rifle', 2, 2, 0xf72331, 2);
  }
  public static revive(obj: unknown): E11_blaster_rifle {
    if (isObjectWithKeys(obj, [])) {
      return Weapon.revive(obj, () => new E11_blaster_rifle());
    }
    throw new Error("couldn't revive E11_blaster_rifle");
  }
}
