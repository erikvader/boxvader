import { Input, NumMap } from './misc';
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

export function serialize(
  message: ServerToClient | ClientToServer,
): ByteBuffer {
  return pson.encode(message).toArrayBuffer();
}

export function deserializeCTS(message: ByteBuffer): ClientToServer {
  const d = pson.decode(message);
  return {
    inputs: Deque.revive(d['inputs'], ele => ele as Input),
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
