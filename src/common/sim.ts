import { Id, Input } from './misc';
import Level from './map'; // alias to not conflict with a map collection
import State from './state';
import { Body, Box, Circle, Vec2, World, Fixture } from 'planck-js';
import { Enemy, Entity, Player } from './entity';
import * as constants from './constants';

export default abstract class Simulation {
  public readonly updateStep: number;

  protected _map: Level;
  protected _world: World;
  protected _bodies: Map<Id, Body>;
  protected _state: State;
  protected _stepCounter: number;
  protected _enemyIdCounter: number;

  public get map(): Level {
    return this._map;
  }

  public get world(): World {
    return this._world;
  }

  public get bodies(): Map<Id, Body> {
    return this._bodies;
  }

  public get state(): State {
    return this._state;
  }

  constructor(map: Level, updateStep: number, enemyIdCounter: number) {
    this.updateStep = updateStep;
    this._map = map;
    this._world = createWorld(map);
    this._bodies = new Map<Id, Body>();
    this._state = new State();
    this._stepCounter = 0;
    this._enemyIdCounter = enemyIdCounter;
  }

  public commonUpdate(): void {
    this._stepCounter += 1;

    //spawns a baby yoda per second
    if (this._stepCounter % Math.floor(1000 / this.updateStep) === 0) {
      this.spawnEnemies();
      this.despawnEnemies();
    }
  }

  /**
   * Create a new `Player` in the simulation and add it to the physics world.
   * @param id ID for the new player.
   * @param name Name of the new player.
   */
  public addPlayer(id: number, name: string): void {
    if (id in this.state.players)
      throw new Error(`ID ${id} is already taken (by a player).`);

    if (id in this.state.enemies)
      throw new Error(`ID ${id} is already taken (by an enemy).`);

    const position = this._map.randomPlayerSpawn();
    const player = new Player(id, constants.PLAYER_HEALTH_MAX, position, name);
    this.state.players[id] = player;
    this.bodies.set(id, createBody(this.world, player));
  }

  //spawns in a fixed location, should probably have a vec2 array as input for location
  // Should probably have a type of enemy as well for later
  private spawnEnemies(): void {
    this.state.enemies[this._enemyIdCounter] = new Enemy(
      this._enemyIdCounter,
      100,
      this._map.randomEnemySpawn(),
    );
    this._enemyIdCounter += 1;
  }

  // despawns with a weird criteria atm, but is easily changed
  private despawnEnemies(): void {
    for (const enemy of Object.values(this.state.enemies)) {
      if (
        enemy.position.x < 0 ||
        enemy.position.x > 512 ||
        enemy.position.y < 0 ||
        enemy.position.y > 512
      ) {
        delete this.state.enemies[enemy.id];
      }
    }
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
  handlePlayerInput(body: Body, input?: Input): void {
    if (input?.fire) {
      this.handleShot(body, input);
    }

    this.updatePlayerBodyFromInput(body, input);
  }

  handleShot(body: Body, input?: Input): void {
    const direction = this.state.players[
      (body.getUserData() as { id: number }).id
    ].direction;

    let multiplier = Infinity;

    if (direction.x > 0) {
      multiplier = constants.MAP_SIZE_X - body.getPosition().x;
    } else if (direction.x < 0) {
      multiplier = body.getPosition().x;
    }
    if (direction.y > 0) {
      multiplier =
        constants.MAP_SIZE_Y - body.getPosition().y < multiplier
          ? constants.MAP_SIZE_Y - body.getPosition().y
          : multiplier;
    } else if (direction.y < 0) {
      multiplier =
        body.getPosition().y < multiplier ? body.getPosition().y : multiplier;
    }

    const endPoint = Vec2.add(
      body.getPosition(),
      Vec2.mul(direction, multiplier),
    );

    this.world.rayCast(body.getPosition(), endPoint, rayCastCallback);
  }

  updatePlayerBodyFromInput(body: Body, input?: Input): void {
    // we move a player by simply increasing or decreasing its velocity in the cardinal directions
    if (input === undefined) {
      // TODO we should probably update the velocities if the player wants to stand still (i.e. if no inputs are availble)
    } else {
      const velocity = body.getLinearVelocity();
      const player = this.state.players[
        (body.getUserData() as { id: number }).id
      ];

      if (input.up && !input.down) {
        velocity.y = -constants.MOVEMENT_SPEED;
        player.direction.x = 0;
        player.direction.y = -1;
      } else if (input.down && !input.up) {
        velocity.y = constants.MOVEMENT_SPEED;
        player.direction.x = 0;
        player.direction.y = 1;
      } else {
        velocity.y = 0;
      }
      if (input.left && !input.right) {
        velocity.x = -constants.MOVEMENT_SPEED;
        player.direction.x = -1;
        player.direction.y = 0;
      } else if (input.right && !input.left) {
        velocity.x = constants.MOVEMENT_SPEED;
        player.direction.x = 1;
        player.direction.y = 0;
      } else {
        velocity.x = 0;
      }

      body.setLinearVelocity(velocity);
    }

    body.setAwake(true);
  }
}

function createWorld(map: Level): World {
  const world = new World();

  const fixDef: any = {
    friction: 0.0,
    restitution: 0.0,
  };

  const tileWidth = constants.TILE_WIDTH;
  const tileHeight = constants.TILE_HEIGHT;
  const halfWidth = tileWidth / 2;
  const halfHeight = tileHeight / 2;

  for (let y = 0; y < map.height; ++y) {
    for (let x = 0; x < map.width; ++x) {
      if (!map.at(x, y).walkable) {
        // TODO: ändra tillbaka till 1x1-rutor typ
        const center = Vec2(
          x * tileWidth + halfWidth,
          y * tileHeight + halfHeight,
        );
        const shape: any = new Box(halfWidth, halfHeight, Vec2.zero(), 0.0);

        const body = world.createBody({
          type: Body.STATIC,
          position: center,
          fixedRotation: true,
          active: true,
          awake: false,
        });

        body.createFixture(shape, fixDef);
      }
    }
  }

  // TODO: hantera kollisioner om något speciellt ska hända
  // world.on('begin-contact', contact => {
  //   let a = contact.getFixtureA(),
  //     b = contact.getFixtureB();

  //   console.log('A: ', a.getType(), a.getBody().getPosition());
  //   console.log('B: ', b.getType(), b.getBody().getPosition());
  // });

  return world;
}

/**
 * Create and return a body for the given entity in the given world.
 * @param world The world that the entity belongs to
 * @param entity The entity to create a body for
 */
export function createBody(world: World, entity: Entity): Body {
  if (entity instanceof Player) {
    return circleBody(
      world,
      entity.position,
      entity.velocity,
      constants.PLAYER_RADIUS,
      entity.id,
    );
  } else if (entity instanceof Enemy) {
    // enemies are identical to players for now
    return circleBody(
      world,
      entity.position,
      entity.velocity,
      constants.PLAYER_RADIUS,
      entity.id,
    );
  }

  throw new Error(`Entity ${entity.id} is not an instace of any known class.`);
}

function circleBody(
  world: World,
  position: Vec2,
  velocity: Vec2,
  radius: number,
  id: number,
): Body {
  // shape must have type any to silence this error:
  // 'CircleShape' is not assignable to parameter of type 'Shape'
  const shape: any = new Circle(radius);
  const body = world.createDynamicBody({
    fixedRotation: true,
    position: position,
    linearVelocity: velocity,
  });
  body.createFixture(shape);
  body.setUserData({ id });
  return body;
}

function rayCastCallback(
  fixture: Fixture,
  point: Vec2,
  normal: Vec2,
  fraction: number,
): number {
  // TODO: Fix hit functionality
  // (fixture.getBody().getUserData() as {id : number}).id to get id of the target
  return fraction;
}
