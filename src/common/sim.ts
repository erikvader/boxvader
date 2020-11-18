import { Id } from './misc';
import Level from './map'; // alias to not conflict with a map collection
import State from './state';
import { Body, Box, Circle, Vec2, World } from 'planck-js';
import { Enemy, Entity, Player } from './entity';

export default abstract class Simulation {
  public readonly updateStep: number;

  private _world: World;
  private _bodies: Map<Id, Body>;
  private _state: State;

  public get world(): World {
    return this._world;
  }

  public get bodies(): Map<Id, Body> {
    return this._bodies;
  }

  public get state(): State {
    return this._state;
  }

  constructor(map: Level, updateStep: number) {
    this.updateStep = updateStep;
    this._world = createWorld(map);
    this._bodies = new Map<Id, Body>();
    this._state = new State();
  }

  public abstract snapshot(): State;
}

function createWorld(map: Level): World {
  const world = new World();

  const fixDef: any = {
    friction: 1.0,
    restitution: 0.0,
  };

  for (let y = 0; y < map.height; ++y) {
    for (let x = 0; x < map.width; ++y) {
      if (!map.at(x, y).walkable) {
        const center = Vec2(x + 0.5, y + 0.5);
        const shape: any = new Box(1, 1, center, 0.0);

        const body = world.createBody({
          type: Body.STATIC,
          position: center,
          fixedRotation: true,
          active: false,
          awake: false,
        });

        body.createFixture(shape, fixDef);
      }
    }
  }

  return world;
}

function createBody(world: World, entity: Entity): Body {
  if (entity instanceof Player) {
    return circleBody(world, entity.position, entity.velocity, 1);
  } else if (entity instanceof Enemy) {
    // enemies are identical to players for now
    return circleBody(world, entity.position, entity.velocity, 1);
  }

  throw new Error(`Entity ${entity.id} is not an instace of any known class.`);
}

function circleBody(world: World, position: Vec2, velocity: Vec2, radius: number): Body {
  // shape must have type any to silence this error:
  // 'CircleShape' is not assignable to parameter of type 'Shape'
  const shape: any = new Circle(radius);
  const body = world.createDynamicBody({ position: position, linearVelocity: velocity });
  body.createFixture(shape);
  return body;
}
