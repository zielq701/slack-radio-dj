import { appConfig } from '../config';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Song } from '../model/song.model';
import Timer = NodeJS.Timer;
import { Stopwatch } from '../utils/timer';

export interface PlayerState {
  url: string;
  time: number;
  playlist: Song[];
  currentSong: Song | null;
}

export class PlayerComponent {
  private timeout: Stopwatch | null = null;
  private currentSongUrl = appConfig.defaultRadioStreamUrl;
  private currentSongSubject = new BehaviorSubject<PlayerState>({
    url: this.currentSongUrl,
    time: 0,
    playlist: [],
    currentSong: null
  });
  private playlist: Song[] = [];
  private playlistSubject = new BehaviorSubject<Song[]>(this.playlist);

  currentSong$: Observable<PlayerState> = this.currentSongSubject;
  playlist$: Observable<Song[]> = this.playlistSubject;

  getCurrentTime(): number {
    return this.timeout ? this.timeout.timeLeft() : 0;
  }

  play(song: Song): void {
    const index = this.playlist.indexOf(song);
    this.currentSongUrl = song.fileUrl;

    if (index !== -1) {
      this.playlist.splice(index, 1);
    }

    song.lastPlayed = new Date().getTime();
    song.save();

    this.currentSongSubject.next({
      url: this.currentSongUrl,
      time: 0,
      currentSong: song,
      playlist: this.playlist
    });

    const duration = song.duration > appConfig.maxSongDurationToPlay ? appConfig.maxSongDurationToPlay : song.duration;

    this.timeout = new Stopwatch(() => {
      if (this.playlist.length) {
        this.play(this.playlist[0]);
      } else {
        this.timeout = null;
        this.currentSongSubject.next({
          url: appConfig.defaultRadioStreamUrl,
          time: 0,
          currentSong: null,
          playlist: this.playlist
        });
        this.currentSongUrl = appConfig.defaultRadioStreamUrl;
      }
    }, duration);
  }

  addSong(song: Song): void {
    this.playlist.push(song);
    this.playlistSubject.next(this.playlist);

    if (this.playlist.length === 1 && this.currentSongUrl === appConfig.defaultRadioStreamUrl) {
      this.play(song);
    }
  }
}
