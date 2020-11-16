import { Input } from './misc';
import { State } from './state';
/**
 * Messages sent from clients to servers.
 * @property seqNum Sequence number for the first input instance in this message. Used to order and identify the input messages.
 * @property inputs The state of the inputs.
 */
export interface ClientMsg {
  seqNum: number;
  inputs: {
    up: boolean;
    down: boolean;
    right: boolean;
    left: boolean;
    fire: boolean;
  };
}

/**
 * Messages sent from servers to clients.
 * @property ackNum Which seqNum the server has acknowledged.
 * @property state The current state of the simulation.
 */
export interface ServerMsg {
  ackNum: number;
  state: State;
}
