import { Id, Input } from './misc';
import Level from './map'; // alias to not conflict with a map collection
import State from './state';
import { Body, Box, Circle, Vec2, World } from 'planck-js';
import { Enemy, Entity, Player } from './entity';
import { MOVEMENT_SPEED } from './constants';

export default abstract class Simulation {
  public readonly updateStep: number;

  protected _world: World;
  protected _bodies: Map<Id, Body>;
  protected _state: State;

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

  public snapshot(): State {
    return this.state.clone();
  }

  protected updateState(): void {
    this.bodies.forEach((body, id) => {
      if (id in this.state.players) {
        const player = this.state.players[id];
        player.position = body.getPosition();
        player.velocity = body.getLinearVelocity();
      } else if (id in this.state.enemies) {
        const enemy = this.state.enemies[id];
        enemy.position = body.getPosition();
        enemy.velocity = body.getLinearVelocity();
      } else {
        throw new Error(
          `Body with ID ${id} belongs to neither a player nor an enemy.`,
        );
      }
    });
  }
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

  // TODO: add callbacks if necessary, for example:
  //   world.on('begin-contact', contact => {});
  return world;
}

/**
 * Create and return a body for the given entity in the given world.
 * @param world The world that the entity belongs to
 * @param entity The entity to create a body for
 */
function createBody(world: World, entity: Entity): Body {
  if (entity instanceof Player) {
    return circleBody(world, entity.position, entity.velocity, 1);
  } else if (entity instanceof Enemy) {
    // enemies are identical to players for now
    return circleBody(world, entity.position, entity.velocity, 1);
  }

  throw new Error(`Entity ${entity.id} is not an instace of any known class.`);
}

function circleBody(
  world: World,
  position: Vec2,
  velocity: Vec2,
  radius: number,
): Body {
  // shape must have type any to silence this error:
  // 'CircleShape' is not assignable to parameter of type 'Shape'
  const shape: any = new Circle(radius);
  const body = world.createDynamicBody({
    position: position,
    linearVelocity: velocity,
  });
  body.createFixture(shape);
  return body;
}

export function updatePlayerBodyFromInput(body: Body, input: Input): void {
  // we move a player by simply increasing or decreasing its velocity in the cardinal directions

  const velocity = body.getLinearVelocity();

  if (input.up && !input.down) velocity.y -= MOVEMENT_SPEED;
  else if (input.down && !input.up) velocity.y += MOVEMENT_SPEED;

  if (input.left && !input.right) velocity.x -= MOVEMENT_SPEED;
  else if (input.right && !input.left) velocity.x += MOVEMENT_SPEED;

  body.setLinearVelocity(velocity);
  body.setAwake(true);
}
