import { appConfig } from '../config';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Song } from '../model/song.model';
import Timer = NodeJS.Timer;

export class PlayerComponent {
  private currentSongUrl = appConfig.defaultRadioStreamUrl;
  private currentSongSubject = new BehaviorSubject(this.currentSongUrl);
  currentSong$: Observable<string> = this.currentSongSubject;
  playlist: Song[] = [];

  play(song: Song) {
    const index = this.playlist.indexOf(song);
    this.currentSongUrl = song.fileUrl;

    if (index !== -1) {
      this.playlist.splice(index, 1);
    }

    song.lastPlayed = new Date().getTime();
    song.save();

    this.currentSongSubject.next(this.currentSongUrl);

    const duration = song.duration > appConfig.maxSongDuration ? appConfig.maxSongDuration : song.duration;

    setTimeout(() => {
      if (this.playlist.length) {
        this.play(this.playlist[0]);
      } else {
        this.currentSongSubject.next(appConfig.defaultRadioStreamUrl);
        this.currentSongUrl = appConfig.defaultRadioStreamUrl;
      }
    }, duration);
  }

  addSong(song: Song) {
    this.playlist.push(song);
    if (this.playlist.length === 1 && this.currentSongUrl === appConfig.defaultRadioStreamUrl) {
      this.play(song);
    }
  }
}
