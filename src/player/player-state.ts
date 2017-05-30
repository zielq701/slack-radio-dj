import { Song } from '../shared/models/song.model';
import { RadioStream } from '../shared/models/radio-stream.model';

export interface PlayerState {
  current: Song | RadioStream | null;
  nextSongs: Song[];
  prevSongs: Song[];
}
