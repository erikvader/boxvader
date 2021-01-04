import { PopArray } from './misc';

const WEAPONS = {
  0: {
    // Standard issue weapon used by imperial stormtroopers
    name: 'E11_blaster_rifle',
    attackRate: 1 / 2,
    attackDamage: 2,
    projectile_color: 0xf72331,
    projectile_width: 2,
    visibility_duration: 3,
  },
};

export default class Weapon {
  protected _timeOfLastShot: number;
  protected _weaponType: number;

  public get attack_rate(): number {
    return WEAPONS[this._weaponType].attackRate;
  }
  public get attack_damage(): number {
    return WEAPONS[this._weaponType].attackDamage;
  }
  public get projectile_color(): number {
    return WEAPONS[this._weaponType].projectile_color;
  }
  public get projectile_width(): number {
    return WEAPONS[this._weaponType].projectile_width;
  }
  public get timeOfLastShot(): number {
    return this._timeOfLastShot;
  }
  public set timeOfLastShot(time: number) {
    this._timeOfLastShot = time;
  }
  public get name(): string {
    return WEAPONS[this._weaponType].name;
  }
  public get projectileVisibiltyDuration(): number {
    return WEAPONS[this._weaponType].visibility_duration;
  }

  constructor(weaponType: number) {
    if (WEAPONS[weaponType] === undefined) {
      throw new Error(`Invalid weapon type '${weaponType}'`);
    }
    this._weaponType = weaponType;
    this._timeOfLastShot = 0;
  }

  public clone(): Weapon {
    const w = new Weapon(this._weaponType);
    w._timeOfLastShot = this._timeOfLastShot;
    return w;
  }

  public flatten(flat: number[]): void {
    flat.push(this._weaponType, this._timeOfLastShot);
  }

  public static explode(buf: PopArray): Weapon {
    const w = new Weapon(buf.pop());
    w._timeOfLastShot = buf.pop();
    return w;
  }

  public equals(other: Weapon): boolean {
    return (
      this._timeOfLastShot === other._timeOfLastShot &&
      this._weaponType === other._weaponType
    );
  }
}
