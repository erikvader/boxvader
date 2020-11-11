import { Id } from './misc';
import { Body, BodyDef, Circle, Vec2, World } from 'planck-js';

/**
 * A generic entity. It has health, a position, and a velocity.
 */
abstract class Entity {
  readonly id: Id;
  readonly hitbox: Vec2;
  readonly maxHealth: number;

  health: number;
  position: Vec2;
  velocity: Vec2;

  constructor(
    id: Id,
    hitbox: Vec2,
    health: number,
    position: Vec2,
    velocity: Vec2,
  ) {
    this.id = id;
    this.hitbox = hitbox;
    this.maxHealth = health;

    this.health = health;
    this.position = position;
    this.velocity = velocity;
  }

  abstract createBody(world: World): Body;
  abstract draw(pixi): void;

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

  score: number;
  firing: boolean;

  constructor(
    id: Id,
    hitbox: Vec2,
    health: number,
    position: Vec2,
    velocity: Vec2,
    name: string,
  ) {
    super(id, hitbox, health, position, velocity);
    this.name = name;
    this.score = 0;
    this.firing = false;
  }

  createBody(world: World): Body {
    const bodyDef: BodyDef = {
      position: this.position,
      linearVelocity: this.velocity,
    };

    // shape must have type any to silence this error:
    // 'CircleShape' is not assignable to parameter of type 'Shape'
    const body = world.createDynamicBody(bodyDef);
    const shape: any = new Circle(1);
    body.createFixture(shape);

    return body;
  }

  draw(pixi): void {
    throw new Error('Method not implemented.');
  }
}
