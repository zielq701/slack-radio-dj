import { appConfig } from '../config';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Song } from '../shared/models/song.model';
import Timer = NodeJS.Timer;
import { Stopwatch } from '../shared/utils/stopwatch';
import { RadioStream } from '../shared/models/radio-stream.model';
import { PlayerState } from './player-state';
import * as playerEvent from './player.events';

const initialState: PlayerState = {
  current: new RadioStream(appConfig.defaultRadioStreamUrl),
  nextSongs: [],
  prevSongs: []
};

export class Player {
  playerEvents$: Observable<playerEvent.Events>;

  private stopwatch: Stopwatch | null = null;
  private playerState: PlayerState;
  private playerEventsSubject: BehaviorSubject<playerEvent.Events>;

  constructor() {
    this.playerEventsSubject = new BehaviorSubject(new playerEvent.SongChangedEvent(initialState));
    this.playerEvents$ = this.playerEventsSubject;

    this.playerEvents$.subscribe(event => {
      this.playerState = event.state;
    });
  }

  getCurrentTime(): number {
    return this.stopwatch ? this.stopwatch.timeLeft : 0;
  }

  playRadioStream(radioStream: RadioStream) {
    this.playerEventsSubject.next(new playerEvent.SongChangedEvent(
      Object.assign({}, this.playerState, {
        current: radioStream
      })
    ));
  }

  playSong(song: Song): void {
    let prevSongs = this.playerState.current instanceof Song ?
      [song].concat(this.playerState.prevSongs) : this.playerState.prevSongs;

    if (prevSongs.length > appConfig.prevSongsLimit) {
      prevSongs = prevSongs.slice(0, appConfig.prevSongsLimit);
    }

    const playerState: PlayerState = {
      current: song,
      nextSongs: this.playerState.nextSongs.filter(nextSong => nextSong.uuid !== song.uuid),
      prevSongs: prevSongs
    };

    this.setStopwatch(playerState, song);
    this.playerEventsSubject.next(new playerEvent.SongChangedEvent(playerState));

    song.lastPlayed = new Date().getTime();
    song.save();
  }

  addNextSong(song: Song): void {
    const playerState = Object.assign({}, this.playerState, {
      nextSongs: this.playerState.nextSongs.concat([song])
    });

    this.playerEventsSubject.next(new playerEvent.AddedNextSong(playerState));
  }

  private setStopwatch(playerState: PlayerState, song: Song): void {
    if (this.stopwatch) {
      this.stopwatch.clear();
    }

    const duration = song.duration > appConfig.maxSongDurationToPlay ? appConfig.maxSongDurationToPlay : song.duration;

    this.stopwatch = new Stopwatch(() => {
      if (playerState.nextSongs.length) {
        this.playSong(playerState.nextSongs[0]);
      } else {
        this.playRadioStream(new RadioStream(appConfig.defaultRadioStreamUrl));
      }
    }, duration);
  }
}
