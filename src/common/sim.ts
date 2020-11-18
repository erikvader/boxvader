import { Id } from './misc';
import Level from './map'; // alias to not conflict with a map collection
import State from './state';
import { Body, Box, Vec2, World } from 'planck-js';

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
    this._world = worldFromMap(map);
    this._bodies = new Map<Id, Body>();
    this._state = new State();
  }

  public abstract snapshot(): State;
}

function worldFromMap(map: Level): World {
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
