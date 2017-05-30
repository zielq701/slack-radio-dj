import * as url from 'url';
import { appConfig } from '../config';
import { Utils } from '../shared/utils/utils';
import { Player } from '../player/player';
import { Mp3Collector } from '../youtube/mp3-collector';
import * as querystring from 'querystring';

export class SlackBot {
  constructor(private slackBot: any,
              private player: Player,
              public botConfig = appConfig.slackBotConfig) {
    slackBot.on('message', this.onMessage.bind(this));
  }

  onMessage(data: any): void {
    if (data.type !== 'message' || !data.text) {
      return;
    }

    const msg = data.text.slice(1, -1);
    const parsed = url.parse(msg);
    if (parsed.hostname && parsed.hostname.indexOf('youtube') !== -1) {
      const params = querystring.parse(parsed.query);

      Mp3Collector.getSongByVideoId(params.v)
        .subscribe(song => {
          this.player.addNextSong(song);

          this.slackBot.postMessage(
            data.channel,
            Utils.drawRandomElementFromArray(appConfig.slackBotMessages.songAddedToQueue),
            this.botConfig);
        }, error => {
          this.slackBot.postMessage(
            data.channel,
            Utils.drawRandomElementFromArray(appConfig.slackBotMessages.addSongToQueueError),
            this.botConfig);

          console.log(error);
        });
    }
  }
}
