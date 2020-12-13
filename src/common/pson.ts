import PSON from 'pson';
import State from './state';
import { ClientToServer, ServerToClient } from './msg';
import Deque from './deque';
import { Input } from './misc';
import { Player, Enemy } from './entity';
import { Vec2 } from 'planck-js';
import * as Weapon from './weapon';

const weapons = [new Weapon.E11_blaster_rifle()];

const things = [
  { inputs: new Deque() } as ClientToServer,
  new Deque(),
  { inputAck: {}, stateNum: 0, state: new State() } as ServerToClient,
  new State(),
  { up: false, down: false, right: false, left: false, fire: false } as Input,
  new Player(0, 0, new Vec2(0, 0), ''),
  new Vec2(0, 0),
  new Enemy(0, 0, new Vec2(0, 0), 0, 0),
];

const fields = new Set();

for (const thing of things) {
  for (const f of Object.getOwnPropertyNames(thing)) {
    fields.add(f);
  }
}

for (const w of weapons) {
  fields.add(w.weaponType);
  for (const f of Object.getOwnPropertyNames(w)) {
    fields.add(f);
  }
}

for (let i = 0; i <= 10; i++) {
  fields.add(i.toString());
}

const pson = new PSON.StaticPair(Array.from(fields.values()));
export default pson;
