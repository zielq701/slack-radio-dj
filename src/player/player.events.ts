import { PlayerEvent } from './player-event';
import { PlayerState } from './player-state';

export const EventTypes = {
  songChanged: 'SongChanged',
  addedNextSong: 'addedNextSong'
};

export class SongChangedEvent implements PlayerEvent {
  type = EventTypes.songChanged;

  constructor(public state: PlayerState) {
  }
}

export class AddedNextSong implements PlayerEvent {
  type = EventTypes.addedNextSong;

  constructor(public state: PlayerState) {
  }
}

export type Events
  = SongChangedEvent;
