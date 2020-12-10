import { Id, reviveVec2, isObjectWithKeys } from './misc';
import { Body, Vec2 } from 'planck-js';
import * as Weapon from './weapon';
/**
 * A generic entity. It has health, a position, and a velocity.
 */
export abstract class Entity {
  public readonly id: Id;
  public readonly maxHealth: number;

  public position: Vec2;
  public velocity: Vec2;
  public direction: Vec2;
  private _health: number;
  public walking: boolean;
  public constructor(id: Id, health: number, position: Vec2) {
    this.id = id;
    this.maxHealth = health;
    this.walking = false;
    this._health = health;
    this.position = position;
    this.velocity = Vec2.zero();
    this.direction = new Vec2(0, -1);
  }

  public static revive(
    obj: unknown,
    construct: (id: Id, health: number, position: Vec2) => Entity,
  ): Entity {
    if (
      isObjectWithKeys(obj, [
        'id',
        'maxHealth',
        'walking',
        'position',
        '_health',
        'velocity',
        'direction',
      ])
    ) {
      const e = construct(
        obj['id'],
        obj['maxHealth'],
        reviveVec2(obj['position']),
      );
      e.walking = obj['walking'];
      e._health = obj['_health'];
      e.velocity = reviveVec2(obj['velocity']);
      e.direction = reviveVec2(obj['direction']);
      return e;
    }
    throw new Error("couldn't revive Entity");
  }

  public get health(): number {
    return this._health;
  }

  public get alive(): boolean {
    return this.health > 0;
  }
  // returns true if enemy dies else false.
  public takeDamage(damage: number): boolean {
    if (damage >= this._health) {
      this._health = 0;
      return true;
    } else {
      this._health -= damage;
      return false;
    }
  }

  public updateFromBody(body: Body): void {
    this.position = body.getPosition();
    this.velocity = body.getLinearVelocity();
  }
}

/**
 * A player with a name and score. An extension of `Entity`.
 */
export class Player extends Entity {
  public readonly name: string;

  public target: Vec2;
  private _score: number;
  public weapons: Weapon.Weapon[];
  public constructor(id: Id, health: number, position: Vec2, name: string) {
    super(id, health, position);
    this.name = name;
    this._score = 0;
    this.target = new Vec2(0, 0);
    this.weapons = [new Weapon.E11_blaster_rifle()];
  }

  public get score(): number {
    return this._score;
  }

  public addScore(points: number): void {
    this._score += points;
  }

  /**
   * Returns a deep copy of a `Player`.
   */
  public clone(): Player {
    const player = new Player(
      this.id,
      this.health,
      this.position.clone(),
      this.name, // name is NOT deep-copied
    );

    player.velocity = this.velocity.clone();
    return player;
  }

  public static revive(obj: unknown): Player {
    if (isObjectWithKeys(obj, ['name', '_score', 'target'])) {
      return Entity.revive(obj, (id: Id, health: number, position: Vec2) => {
        const p = new Player(id, health, position, obj['name']);
        p._score = obj['_score'];
        p.target = obj['target'];
        p.weapons = [];
        for (const weapon of obj['weapons']) {
          p.weapons.push(Weapon[weapon['_weaponType']].revive(weapon));
        }

        return p;
      }) as Player;
    }
    throw new Error("couldn't revive Player");
  }
}

export class Enemy extends Entity {
  public damage: number;
  public score: number;
  public constructor(
    id: Id,
    health: number,
    position: Vec2,
    damage: number,
    score: number,
  ) {
    super(id, health, position);
    this.damage = damage;
    this.score = score;
  }

  /**
   * Returns a deep copy of an `Enemy`.
   */
  public clone(): Enemy {
    const enemy = new Enemy(
      this.id,
      this.health,
      this.position.clone(),
      this.damage,
      this.score,
    );

    enemy.velocity = this.velocity.clone();
    return enemy;
  }

  public static revive(obj: unknown): Enemy {
    if (isObjectWithKeys(obj, ['damage', 'score'])) {
      return Entity.revive(
        obj,
        (id: Id, health: number, position: Vec2) =>
          new Enemy(id, health, position, obj['damage'], obj['score']),
      ) as Enemy;
    }
    throw new Error("couldn't revive Enemy");
  }
}
