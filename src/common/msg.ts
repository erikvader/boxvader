import { Input, NumMap, compactInput, explodeInput } from './misc';
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
  const flattened: number[] = [];
  flattened.push(stc.stateNum);

  const numacks = Object.values(stc.inputAck).length;
  flattened.push(numacks);
  for (let i = 0; i < numacks; i++) {
    const ia = stc.inputAck[i];
    if (ia === undefined) {
      throw new Error('player IDs are not continous it seems');
    }
    flattened.push(ia);
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
    return pson.encode(msg).toArrayBuffer();
  }
}

export function deserializeCTS(message: ByteBuffer): ClientToServer {
  const d = pson.decode(message);
  return {
    inputs: Deque.fromArrayMap(d['inputs'], d['startSeq'], explodeInput),
  };
}

export function deserializeSTC(message: ByteBuffer): ServerToClient {
  const d = pson.decode(message);
  return {
    inputAck: d['inputAck'],
    stateNum: d['stateNum'],
    state: State.revive(d['state']),
  };
}
