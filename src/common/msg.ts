import { Input, NumMap, compactInput, explodeInput, PopArray } from './misc';
import State from './state';
import { ByteBuffer } from 'bytebuffer';
import pson from './pson';
import Deque from './deque';

/**
 * Messages sent from clients to servers.
 * @property inputs The inputs to send with their associated sequence numbers.
 */
export interface ClientToServer {
  inputs: Deque<Input>;
}

/**
 * Messages sent from servers to clients.
 * @property inputAck Which seqNum in [[ClientToServer]] the server has
 * acknowledged for all clients.
 * @property stateNum Which state this is.
 * @property state The current state of the simulation.
 */
export interface ServerToClient {
  inputAck: NumMap<number>;
  stateNum: number;
  state: State;
}

function flattenSTC(stc: ServerToClient): number[] {
  const numPlayers = Object.values(stc.state.players).length;
  const numAcks = Object.values(stc.inputAck).length;

  const flattened: number[] = [];
  flattened.push(stc.stateNum);

  flattened.push(numPlayers);
  for (let i = 0; i < numPlayers; i++) {
    const ia = stc.inputAck[i];
    if (ia === undefined && numPlayers === numAcks) {
      throw new Error('player IDs are not continous it seems');
    }
    if (ia !== undefined && ia < 0) {
      throw new Error("inputAck shouldn't be negative");
    }
    flattened.push(ia ?? -1);
  }

  stc.state.flatten(flattened);
  return flattened;
}

export function serialize(
  message: ServerToClient | ClientToServer,
): ByteBuffer {
  if ('inputs' in message) {
    const msg = message as ClientToServer;
    return pson
      .encode({
        inputs: msg.inputs.mapArray(compactInput),
        startSeq: msg.inputs.first,
      })
      .toArrayBuffer();
  } else {
    const msg = message as ServerToClient;
    const buf = flattenSTC(msg);
    return pson.encode(buf).toArrayBuffer();
  }
}

export function deserializeCTS(message: ByteBuffer): ClientToServer {
  const d = pson.decode(message);
  return {
    inputs: Deque.fromArrayMap(d['inputs'], d['startSeq'], explodeInput),
  };
}

export function deserializeSTC(message: ByteBuffer): ServerToClient {
  let buf = pson.decode(message);
  buf.reverse();
  buf = new PopArray(buf);

  const stateNum = buf.pop();

  const inputAck = {};
  const numAcks = buf.pop();
  for (let i = 0; i < numAcks; i++) {
    const ia = buf.pop();
    if (ia >= 0) {
      inputAck[i] = ia;
    }
  }

  const state = State.explode(buf);

  return {
    inputAck,
    stateNum,
    state,
  };
}
