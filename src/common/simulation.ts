import { Id, Input } from './misc';
import GameMap from './gameMap';
import State from './state';
import { Body, Box, Circle, Vec2, World, Fixture } from 'planck-js';
import { Enemy, Entity, Player } from './entity';
import * as constants from './constants';

export default abstract class Simulation {
  public readonly updateStep: number;

  protected _gameMap: GameMap;
  protected _world: World;
  protected _bodies: Map<Id, Body>;
  protected _state: State;
  protected _stepCounter: number;
  protected _enemyIdCounter: number;

  public get map(): GameMap {
    return this._gameMap;
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

  /**
   * @param map The map to use
   * @param updateStep How big an update step is in seconds.
   * @param enemyIdCounter The starting value for the enemy ids.
   */
  constructor(map: GameMap, updateStep: number, enemyIdCounter: number) {
    this.updateStep = updateStep;
    this._world = this.createWorld(map);
    this._bodies = new Map<Id, Body>();
    this._state = new State();
    this._stepCounter = 0;
    this._enemyIdCounter = enemyIdCounter;
    this._gameMap = map;
  }

  public commonUpdate(): void {
    this._stepCounter += 1;

    //spawns a baby yoda per second
    if (this._stepCounter % Math.floor(1 / this.updateStep) === 0) {
      this.addEnemy();
    }
    this.despawnEntities();
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

    const position = this._gameMap.randomPlayerSpawn();
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

    const position = this._gameMap.randomEnemySpawn();

    const enemy = new Enemy(this._enemyIdCounter, 2, position, 1);
    this.state.enemies[this._enemyIdCounter] = enemy;
    this.bodies.set(this._enemyIdCounter, createBody(this.world, enemy));
    this._enemyIdCounter += 1;
  }

  private despawnEntities(): void {
    for (const enemy of Object.values(this.state.enemies)) {
      if (!enemy.alive) {
        this._world.destroyBody(this._bodies.get(enemy.id)!);
        this._bodies.delete(enemy.id);

        delete this.state.enemies[enemy.id];
      }
    }
    for (const player of Object.values(this.state.players)) {
      if (!player.alive && this._bodies.get(player.id) !== undefined) {
        this._world.destroyBody(this._bodies.get(player.id)!);
        this._bodies.delete(player.id);
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

  private moveEnemies(): void {
    for (const enemy of Object.values(this.state.enemies)) {
      let targetPlayerPosition = new Vec2(enemy.position);
      const enemyTile = this._gameMap.positionToTile(enemy.position);
      let maxDistance = Infinity;
      for (const player of Object.values(this.state.players)) {
        if (player.alive === false) {
          continue;
        }
        const playerTile = this._gameMap.positionToTile(player.position);
        if (
          this._gameMap.floydWarshallWeightMatrix[enemyTile][playerTile] <
          maxDistance
        ) {
          maxDistance = this._gameMap.floydWarshallWeightMatrix[enemyTile][
            playerTile
          ];
          targetPlayerPosition = player.position;
        }
      }
      const newMove = this.enemyNextMove(enemy.position, targetPlayerPosition);
      newMove.mul(constants.ENEMY_MOVEMENT_SPEED);
      const body: Body = this._bodies.get(enemy.id)!;
      body.setLinearVelocity(newMove);
    }
  }

  private enemyNextMove(currentPosition: Vec2, targetPosition: Vec2): Vec2 {
    const nextPosition = this._gameMap.getInput(
      currentPosition,
      targetPosition,
    );

    const x = Math.sign(nextPosition.x - currentPosition.x);
    const y = Math.sign(nextPosition.y - currentPosition.y);
    return new Vec2(x, y);
  }

  handlePlayerInput(body: Body, id: number, input?: Input): void {
    if (this.state.players[id].alive === false) {
      return;
    }
    if (input?.fire) {
      this.state.players[id].firing = true;
      this.handleShot(body, input);
    } else {
      this.state.players[id].firing = false;
    }

    this.updatePlayerBodyFromInput(body, input);
  }

  handleShot(body: Body, input?: Input): void {
    const player = this.state.players[
      (body.getUserData() as { id: number }).id
    ];

    //this._stepCounter % Math.floor(1 / this.updateStep) === 0

    if (
      !(
        player.weapons[0].timeOfLastShot +
          player.weapons[0].attack_rate * constants.SERVER_UPS <=
        this._stepCounter
      )
    ) {
      player.firing = false;
      return;
    }
    player.weapons[0].timeOfLastShot = this._stepCounter;

    const direction = player.direction;

    let multiplier = Infinity;

    const mapWidth = this._gameMap.width * constants.TILE_LOGICAL_SIZE;
    const mapHeight = this._gameMap.height * constants.TILE_LOGICAL_SIZE;

    if (direction.x > 0) {
      multiplier = mapWidth - body.getPosition().x;
    } else if (direction.x < 0) {
      multiplier = body.getPosition().x;
    }
    if (direction.y > 0) {
      multiplier =
        mapHeight - body.getPosition().y < multiplier
          ? mapHeight - body.getPosition().y
          : multiplier;
    } else if (direction.y < 0) {
      multiplier =
        body.getPosition().y < multiplier ? body.getPosition().y : multiplier;
    }

    if (multiplier === Infinity) return;

    const endPoint = Vec2.add(
      body.getPosition(),
      Vec2.mul(direction, multiplier),
    );
    let closestTarget: {
      fixture?: Fixture;
      fraction: number;
      point?: Vec2;
    } = {
      fraction: Infinity,
    };

    this.world.rayCast(
      body.getPosition(),
      endPoint,
      (fixture, point, normal, fraction) => {
        if (fraction < closestTarget.fraction) {
          closestTarget = { fixture, fraction, point };
        }
        return fraction;
      },
    );

    this.handleHit(
      closestTarget.fraction,
      player,
      closestTarget.fixture,
      closestTarget.point,
    );
  }

  handleHit(
    fraction: number,
    player: Player,
    fixture?: Fixture,
    point?: Vec2,
  ): void {
    if (!fixture || !point) {
      return;
    }

    this.state.players[player.id].target.x = point.x;
    this.state.players[player.id].target.y = point.y;
    const userData = fixture.getBody().getUserData() as { id: number }; ///to get id of the target
    this._state.enemies[userData?.id]?.takeDamage(
      this.state.players[player.id].weapons[0].attack_damage,
    );
  }

  updatePlayerBodyFromInput(body: Body, input?: Input): void {
    // we move a player by simply increasing or decreasing its velocity in the cardinal directions
    const velocity = body.getLinearVelocity();

    if (input === undefined) {
      // if no inputs are sent, set the player to stand still
      velocity.x = velocity.y = 0;
    } else {
      const player = this.state.players[
        (body.getUserData() as { id: number }).id
      ];
      const newDirection = new Vec2(0, 0);
      if (input.up && !input.down) {
        velocity.y = -constants.PLAYER_MOVEMENT_SPEED;
        newDirection.y = -1;
      } else if (input.down && !input.up) {
        velocity.y = constants.PLAYER_MOVEMENT_SPEED;
        newDirection.y = 1;
      } else {
        velocity.y = 0;
      }
      if (input.left && !input.right) {
        velocity.x = -constants.PLAYER_MOVEMENT_SPEED;
        newDirection.x = -1;
      } else if (input.right && !input.left) {
        velocity.x = constants.PLAYER_MOVEMENT_SPEED;
        newDirection.x = 1;
      } else {
        velocity.x = 0;
      }
      if (!Vec2.areEqual(newDirection, Vec2.zero())) {
        player.direction = newDirection;
      }
    }

    body.setLinearVelocity(velocity);
    body.setAwake(true);
  }

  createWorld(map: GameMap): World {
    const world = new World();

    const fixDef: any = {
      friction: 0.0,
      restitution: 0.0,
    };

    const halfSize = 0.5 * constants.TILE_LOGICAL_SIZE;

    for (let y = 0; y < map.height; ++y) {
      for (let x = 0; x < map.width; ++x) {
        if (!map.at(x, y).walkable) {
          const center = new Vec2(
            x * constants.TILE_LOGICAL_SIZE + halfSize,
            y * constants.TILE_LOGICAL_SIZE + halfSize,
          );
          const shape: any = new Box(halfSize, halfSize, Vec2.zero(), 0.0);

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
    world.on('begin-contact', contact => {
      const user_data_a = contact
        .getFixtureA()
        .getBody()
        .getUserData() as { id: number };
      const user_data_b = contact
        .getFixtureB()
        .getBody()
        .getUserData() as { id: number };
      let player_id: number | undefined = undefined;
      let enemy_id: number | undefined = undefined;
      if (this._state.players[user_data_a?.id] !== undefined) {
        player_id = user_data_a?.id;
        enemy_id = user_data_b?.id;
      }
      if (this._state.players[user_data_b?.id] !== undefined) {
        player_id = user_data_b?.id;
        enemy_id = user_data_a?.id;
      }
      if (
        enemy_id !== undefined &&
        player_id !== undefined &&
        this._state.enemies[enemy_id] !== undefined
      ) {
        const damage = this._state.enemies[enemy_id].damage;

        this._state.players[player_id].takeDamage(damage);
      }

      //console.log(id_a);
      //console.log(id_b);
      //  console.log('A: ', a.getType(), a.getBody().getPosition());
      //  console.log('B: ', b.getType(), b.getBody().getPosition());
    });

    return world;
  }
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
      constants.PLAYER_HITBOX_RADIUS,
      entity.id,
    );
  } else if (entity instanceof Enemy) {
    // enemies are identical to players for now
    return circleBody(
      world,
      entity.position,
      entity.velocity,
      constants.ENEMY_HITBOX_RADIUS,
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
