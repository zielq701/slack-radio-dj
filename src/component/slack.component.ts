import * as url from 'url';
import { appConfig } from '../config';
import { SongService } from '../service/song.service';
import { Song } from '../model/song.model';
import { PlayerComponent } from './player.component';
import { Utils } from '../utils/utils';

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
        this.slackBot.postMessage(
          data.channel,
          Utils.drawRandomElementFromArray(appConfig.slackBotMessages.songAddedToQueue),
          this.botConfig);
      } catch (e) {
        this.slackBot.postMessage(
          data.channel,
          Utils.drawRandomElementFromArray(appConfig.slackBotMessages.addSongToQueueError),
          this.botConfig);
        console.log(e);
      }
    } else if (data.text === ':-1:') {
      this.player.downVoteCurrentSong(data.user);
    }
  }
}
