import * as url from 'url';
import { appConfig } from '../config';
import { SongService } from '../service/song.service';
import { Song } from '../model/song.model';
import { PlayerComponent } from './player.component';

export class SlackComponent {
  constructor(private slackBot: any, private player: PlayerComponent, public botConfig = appConfig.slackBotConfig) {
    slackBot.on('message', this.onMessage.bind(this));
  }

  async onMessage(data: any): Promise<void> {
    if (data.type !== 'message' || !data.text) {
      return;
    }

    const msg = data.text.slice(1, -1);
    const parsed = url.parse(msg);
    if (parsed.hostname && parsed.hostname.indexOf('youtube') !== -1) {
      let song: Song | null = null;

      try {
        song = await SongService.getSong(parsed);
        this.player.addSong(song);
        this.slackBot.postMessage(data.channel, 'Twoja pioseneczka została dodana do playlisty!', this.botConfig);
      } catch (e) {
        console.log(e);
        this.slackBot.postMessage(data.channel, `Coś poszło nie tak :( [${e}]`, this.botConfig);
      }
    }
  }
}
