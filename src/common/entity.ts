import { Id } from './misc';
import { Body, BodyDef, Circle, Vec2, World } from 'planck-js';

/**
 * A generic entity. It has health, a position, and a velocity.
 */
abstract class Entity {
  readonly id: Id;
  readonly hitbox: Vec2;
  readonly maxHealth: number;

  private health: number;
  protected position: Vec2;
  protected velocity: Vec2;

  constructor(
    id: Id,
    hitbox: Vec2,
    health: number,
    position: Vec2,
  ) {
    this.id = id;
    this.hitbox = hitbox;
    this.maxHealth = health;

    this.health = health;
    this.position = position;
    this.velocity = Vec2.zero();
  }

  abstract createBody(world: World): Body;
  abstract draw(pixi): void;

  getHealth(): number {
    return this.health;
  }

  getPosition(): Vec2 {
    return this.position;
  }

  getVelocity(): Vec2 {
    return this.velocity;
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  takeDamage(damage: number): void {
    if (damage > this.health) {
      this.health = 0;
    } else {
      this.health -= damage;
    }
  }

  updateFromBody(body: Body): void {
    this.position = body.getPosition();
    this.velocity = body.getLinearVelocity();
  }
}

/**
 * A player with a name and score. An extension of `Entity`.
 */
export class Player extends Entity {
  readonly name: string;

  private score: number;
  private firing: boolean;

  constructor(
    id: Id,
    hitbox: Vec2,
    health: number,
    position: Vec2,
    name: string,
  ) {
    super(id, hitbox, health, position);
    this.name = name;
    this.score = 0;
    this.firing = false;
  }

  getScore(): number {
    return this.score;
  }

  isFiring(): boolean {
    return this.firing;
  }

  addScore(points: number): void {
    this.score += points;
  }

  setFiring(firing: boolean): void {
    this.firing = firing;
  }

  createBody(world: World): Body {
    return createBody(world, this);
  }

  draw(pixi): void {
    throw new Error('Method not implemented.');
  }
}

export class Enemy extends Entity {
  constructor(
    id: Id,
    hitbox: Vec2,
    health: number,
    position: Vec2,
  ) {
    super(id, hitbox, health, position);
  }

  createBody(world: World): Body {
    return createBody(world, this);
  }

  draw(pixi): void {
    throw new Error('Method not implemented.');
  }
}

function createBody(world: World, entity: Entity): Body {
  const bodyDef: BodyDef = {
    position: entity.getPosition(),
    linearVelocity: entity.getVelocity(),
  };

  // shape must have type any to silence this error:
  // 'CircleShape' is not assignable to parameter of type 'Shape'
  const body = world.createDynamicBody(bodyDef);
  const shape: any = new Circle(1);
  body.createFixture(shape);

  return body;
}
