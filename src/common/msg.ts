import { Input } from './misc';
import State from './state';
import ByteBuffer from 'ByteBuffer';
import pson from './pson';
/**
 * Messages sent from clients to servers.
 * @property seqNum Sequence number for the first input instance in this message. Used to order and identify the input messages.
 * @property inputs The state of the inputs.
 */
export interface ClientToServer {
  seqNum: number;
  inputs: Input[];
}

/**
 * Messages sent from servers to clients.
 * @property ackNum Which seqNum the server has acknowledged.
 * @property state The current state of the simulation.
 */
export interface ServerToClient {
  ackNum: number;
  state: State;
}

export function serialize(
  message: ServerToClient | ClientToServer,
): ByteBuffer {
  return pson.encode(message).toArrayBuffer();
}

export function deserializeCTS(message: ByteBuffer): ClientToServer {
  return pson.decode(message);
}

export function deserializeSTC(message: ByteBuffer): ServerToClient {
  return pson.decode(message);
}
