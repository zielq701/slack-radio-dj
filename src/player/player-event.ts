import { PlayerState } from './player-state';

export interface PlayerEvent {
  type: string;
  state: PlayerState;
}
