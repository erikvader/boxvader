import { Id } from './misc';
import { Body, BodyDef, Circle, Vec2, World } from 'planck-js';

/**
 * A generic entity. It has health, a position, and a velocity.
 */
abstract class Entity {
  public readonly id: Id;
  public readonly hitbox: Vec2;
  public readonly maxHealth: number;

  private _health: number;
  protected _position: Vec2;
  protected _velocity: Vec2;

  public constructor(id: Id, hitbox: Vec2, health: number, position: Vec2) {
    this.id = id;
    this.hitbox = hitbox;
    this.maxHealth = health;

    this._health = health;
    this._position = position;
    this._velocity = Vec2.zero();
  }

  public abstract createBody(world: World): Body;
  public abstract draw(pixi): void;

  public get health(): number {
    return this._health;
  }

  public get position(): Vec2 {
    return this._position;
  }

  public get velocity(): Vec2 {
    return this._velocity;
  }

  public get alive(): boolean {
    return this.health > 0;
  }

  public takeDamage(damage: number): void {
    if (damage > this._health) {
      this._health = 0;
    } else {
      this._health -= damage;
    }
  }

  public updateFromBody(body: Body): void {
    this._position = body.getPosition();
    this._velocity = body.getLinearVelocity();
  }
}

/**
 * A player with a name and score. An extension of `Entity`.
 */
export class Player extends Entity {
  public readonly name: string;

  private _firing: boolean;
  private _score: number;

  public constructor(
    id: Id,
    hitbox: Vec2,
    health: number,
    position: Vec2,
    name: string,
  ) {
    super(id, hitbox, health, position);
    this.name = name;
    this._score = 0;
    this._firing = false;
  }

  public get firing(): boolean {
    return this._firing;
  }

  public set firing(firing: boolean) {
    this._firing = firing;
  }

  public get score(): number {
    return this._score;
  }

  public addScore(points: number): void {
    this._score += points;
  }

  public createBody(world: World): Body {
    return createBody(world, this);
  }

  public draw(pixi): void {
    throw new Error('Method not implemented.');
  }
}

export class Enemy extends Entity {
  public constructor(id: Id, hitbox: Vec2, health: number, position: Vec2) {
    super(id, hitbox, health, position);
  }

  public createBody(world: World): Body {
    return createBody(world, this);
  }

  public draw(pixi): void {
    throw new Error('Method not implemented.');
  }
}

function createBody(world: World, entity: Entity): Body {
  const bodyDef: BodyDef = {
    position: entity.position,
    linearVelocity: entity.velocity,
  };

  // shape must have type any to silence this error:
  // 'CircleShape' is not assignable to parameter of type 'Shape'
  const body = world.createDynamicBody(bodyDef);
  const shape: any = new Circle(1);
  body.createFixture(shape);

  return body;
}
