import { Id, Input } from './misc';
import GameMap from './gameMap'; // alias to not conflict with a map collection
import State from './state';
import { Body, Box, Circle, Vec2, World } from 'planck-js';
import { Enemy, Entity, Player } from './entity';
import * as constants from './constants';

export default abstract class Simulation {
  public readonly updateStep: number;

  protected _world: World;
  protected _bodies: Map<Id, Body>;
  protected _state: State;
  protected _stepCounter: number;
  protected _enemyIdCounter: number;
  protected _gameMap: GameMap;

  public get world(): World {
    return this._world;
  }

  public get bodies(): Map<Id, Body> {
    return this._bodies;
  }

  public get state(): State {
    return this._state;
  }

  public get gameMap(): GameMap {
    return this._gameMap;
  }

  constructor(gameMap: GameMap, updateStep: number, enemyIdCounter: number) {
    this.updateStep = updateStep;
    this._world = createWorld(gameMap);
    this._bodies = new Map<Id, Body>();
    this._state = new State();
    this._stepCounter = 0;
    this._enemyIdCounter = enemyIdCounter;
    this._gameMap = gameMap;
  }

  public commonUpdate(): void {
    this._stepCounter += 1;

    //spawns a baby yoda per second
    if (this._stepCounter % Math.floor(1000 / this.updateStep) === 0) {
      this.addEnemy();
      this.despawnEnemies();
    }
    this.moveEnemies();
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

    const position = Vec2(
      Math.random() *
        (constants.PLAYER_SPAWN_X_MAX - constants.PLAYER_SPAWN_X_MIN) +
        constants.PLAYER_SPAWN_X_MIN,
      Math.random() *
        (constants.PLAYER_SPAWN_Y_MAX - constants.PLAYER_SPAWN_Y_MIN) +
        constants.PLAYER_SPAWN_Y_MIN,
    );

    const player = new Player(id, constants.PLAYER_HEALTH_MAX, position, name);
    this.state.players[id] = player;
    this.bodies.set(id, createBody(this.world, player));
  }

  //spawns in a fixed location, should probably have a vec2 array as input for location
  // Should probably have a type of enemy as well for later

  public addEnemy(): void {
    if (this._enemyIdCounter in this.state.players)
      throw new Error(
        `ID ${this._enemyIdCounter} is already taken (by a player).`,
      );

    if (this._enemyIdCounter in this.state.enemies)
      throw new Error(
        `ID ${this._enemyIdCounter} is already taken (by an enemy).`,
      );

    const position = Vec2(48, 48);

    const enemy = new Enemy(this._enemyIdCounter, 10, position);
    this.state.enemies[this._enemyIdCounter] = enemy;
    this.bodies.set(this._enemyIdCounter, createBody(this.world, enemy));
    this._enemyIdCounter += 1;
  }

  // despawns with a weird criteria atm, but is easily changed
  private despawnEnemies(): void {
    for (const enemy of Object.values(this.state.enemies)) {
      if (
        enemy.position.x < 0 ||
        enemy.position.x > 400 ||
        enemy.position.y < 0 ||
        enemy.position.y > 400
      ) {
        this._bodies.delete(enemy.id);
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
  //uses manhattan distance atm
  private moveEnemies(): void {
    let targetPlayerPosition = new Vec2();

    for (const enemy of Object.values(this.state.enemies)) {
      let maxDistance = Infinity;
      for (const player of Object.values(this.state.players)) {
        if (
          Math.abs(enemy.position.x - player.position.x) +
            Math.abs(enemy.position.y - player.position.y) <
          maxDistance
        ) {
          maxDistance =
            Math.abs(enemy.position.x - player.position.x) +
            Math.abs(enemy.position.y - player.position.y);
          targetPlayerPosition = player.position;
        }
      }
      const newMove = this.nextMove(enemy.position, targetPlayerPosition);
      enemy.move(newMove);
      const body: Body = this._bodies.get(enemy.id)!;
      body.setLinearVelocity(newMove);
    }
  }

  private nextMove(currentPosition: Vec2, targetPosition: Vec2): Vec2 {
    const nextPosition = this.gameMap.getInput(currentPosition, targetPosition);
    const nextMove: Vec2 = new Vec2(0, 0);

    if (nextPosition.x > currentPosition.x) {
      if (nextPosition.y > currentPosition.y) {
        nextMove.add(Vec2(1, 1));
      } else if (nextPosition.y < currentPosition.y) {
        nextMove.add(Vec2(1, -1));
      } else {
        nextMove.add(Vec2(1, 0));
      }
    } else if (nextPosition.x < currentPosition.x) {
      if (nextPosition.y > currentPosition.y) {
        nextMove.add(Vec2(-1, 1));
      } else if (nextPosition.y < currentPosition.y) {
        nextMove.add(Vec2(-1, -1));
      } else {
        nextMove.add(Vec2(-1, 0));
      }
    } else {
      if (nextPosition.y > currentPosition.y) {
        nextMove.add(Vec2(0, 1));
      } else if (nextPosition.y < currentPosition.y) {
        nextMove.add(Vec2(0, -1));
      } else {
        nextMove.add(Vec2(0, 0));
      }
    }
    return nextMove;
  }
}

function createWorld(map: GameMap): World {
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
    );
  } else if (entity instanceof Enemy) {
    // enemies are identical to players for now
    return circleBody(
      world,
      entity.position,
      entity.velocity,
      constants.PLAYER_RADIUS,
    );
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
    fixedRotation: true,
    position: position,
    linearVelocity: velocity,
  });
  body.createFixture(shape);
  return body;
}

export function updatePlayerBodyFromInput(body: Body, input?: Input): void {
  // we move a player by simply increasing or decreasing its velocity in the cardinal directions

  if (input === undefined) {
    // TODO we should probably update the velocities if the player wants to stand still (i.e. if no inputs are availble)
  } else {
    const velocity = body.getLinearVelocity();

    if (input.up && !input.down) velocity.y = -constants.MOVEMENT_SPEED;
    else if (input.down && !input.up) velocity.y = constants.MOVEMENT_SPEED;
    else velocity.y = 0;

    if (input.left && !input.right) velocity.x = -constants.MOVEMENT_SPEED;
    else if (input.right && !input.left) velocity.x = constants.MOVEMENT_SPEED;
    else velocity.x = 0;

    body.setLinearVelocity(velocity);
  }

  body.setAwake(true);
}
