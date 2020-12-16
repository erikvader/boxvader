import { Id, PopArray } from './misc';
import { Body, Vec2 } from 'planck-js';
import Weapon from './weapon';
/**
 * A generic entity. It has health, a position, and a velocity.
 */
export abstract class Entity {
  public readonly id: Id;
  public readonly maxHealth: number;

  public position: Vec2;
  public velocity: Vec2;
  public direction: Vec2;
  public walking: boolean;

  private _health: number;

  public constructor(id: Id, health: number, position: Vec2) {
    this.id = id;
    this.maxHealth = health;
    this.walking = false;
    this._health = health;
    this.position = position;
    this.velocity = Vec2.zero();
    this.direction = new Vec2(0, -1);
  }

  public clone(construct: () => Entity): Entity {
    const e = construct();
    // id, position, and _health are cloned by the children's clone() functions
    e.velocity = this.velocity;
    e.direction = this.direction;
    e.walking = this.walking;

    return e;
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
  public giveMaxHealth(): void {
    this._health = this.maxHealth;
  }

  public updateFromBody(body: Body): void {
    this.position = body.getPosition();
    this.velocity = body.getLinearVelocity();
  }

  public respawn(position: Vec2): void {
    this.giveMaxHealth();
    this.position = position.clone();
    this.velocity = Vec2.zero();
    this.walking = false;
  }

  public flatten(flat: number[]): void {
    flat.push(
      this.id,
      this.maxHealth,
      Math.fround(this.position.x),
      Math.fround(this.position.y),
      Math.fround(this.velocity.x),
      Math.fround(this.velocity.y),
      Math.fround(this.direction.x),
      Math.fround(this.direction.y),
      this._health,
      this.walking ? 1 : 0,
    );
  }

  public static explode(
    buf: PopArray,
    construct: (id: Id, health: number, position: Vec2) => Entity,
  ): Entity {
    const id = buf.pop();
    const maxHealth = buf.pop();
    const positionx = buf.pop();
    const positiony = buf.pop();
    const velocityx = buf.pop();
    const velocityy = buf.pop();
    const directionx = buf.pop();
    const directiony = buf.pop();
    const _health = buf.pop();
    const walking = buf.pop() === 1;

    const entity = construct(id, maxHealth, new Vec2(positionx, positiony));
    entity._health = _health;
    entity.walking = walking;
    entity.velocity = new Vec2(velocityx, velocityy);
    entity.direction = new Vec2(directionx, directiony);

    return entity;
  }
}

/**
 * A player with a score. An extension of `Entity`.
 */
export class Player extends Entity {
  public target: Vec2;
  public weapons: Weapon[];

  private _score: number;

  public constructor(id: Id, health: number, position: Vec2) {
    super(id, health, position);
    this._score = 0;
    this.target = new Vec2(0, 0);
    this.weapons = [new Weapon(0)];
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
    return super.clone(() => {
      return new Player(this.id, this.health, this.position.clone());
    }) as Player;
  }

  public flatten(flat: number[]): void {
    super.flatten(flat);
    flat.push(
      Math.fround(this.target.x),
      Math.fround(this.target.y),
      this._score,
      this.weapons.length,
    );
    for (const w of this.weapons) {
      w.flatten(flat);
    }
  }

  public static explode(buf: PopArray): Player {
    return Entity.explode(buf, (id: Id, health: number, position: Vec2) => {
      const p = new Player(id, health, position);
      p.target.x = buf.pop();
      p.target.y = buf.pop();
      p._score = buf.pop();

      const weaponsLength = buf.pop();
      p.weapons = [];
      for (let i = 0; i < weaponsLength; i++) {
        p.weapons.push(Weapon.explode(buf));
      }

      return p;
    }) as Player;
  }
}

export class Enemy extends Entity {
  public damage: number;
  public knockbackTime: number;
  public knockbackVelocity: Vec2;
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
    this.knockbackVelocity = Vec2.zero();
    this.knockbackTime = 0;
    this.score = score;
  }

  /**
   * Returns a deep copy of an `Enemy`.
   */
  public clone(): Enemy {
    return super.clone(() => {
      const e = new Enemy(
        this.id,
        this.health,
        this.position.clone(),
        this.damage,
        this.score,
      );
      e.knockbackTime = this.knockbackTime;
      e.knockbackVelocity = this.knockbackVelocity.clone();
      return e;
    }) as Enemy;
  }

  public flatten(flat: number[]): void {
    super.flatten(flat);
    flat.push(
      this.damage,
      this.score,
      Math.fround(this.knockbackVelocity.x),
      Math.fround(this.knockbackVelocity.y),
      this.knockbackTime,
    );
  }

  public static explode(buf: PopArray): Enemy {
    return Entity.explode(buf, (id: Id, health: number, position: Vec2) => {
      const damage = buf.pop();
      const score = buf.pop();
      const e = new Enemy(id, health, position, damage, score);
      e.knockbackVelocity.x = buf.pop();
      e.knockbackVelocity.y = buf.pop();
      e.knockbackTime = buf.pop();
      return e;
    }) as Enemy;
  }
}
