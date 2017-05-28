import { Song } from '../model/song.model';
import * as querystring from 'querystring';
import * as request from 'request';
import { Url } from 'url';
import { appConfig } from '../config';
import { SongMetadataResponse } from '../interface/song-metadata-response.interface';
import { SongMetadata } from '../interface/song-metadata.interface';
import * as ytdl from 'youtube-dl';
import * as path from 'path';
import * as parseIsoDuration from 'parse-iso-duration';
import * as fs from 'fs';

export class SongService {
  private static async downloadSong(songMetadata: SongMetadata): Promise<Song> {
    return new Promise<Song>((resolve, reject) => {
      ytdl.exec(`https://www.youtube.com/watch?v=${songMetadata.id}`, [
        '--restrict-filenames',
        '-o', path.join(appConfig.songsDirectory, songMetadata.id + '.%(ext)s'),
        '--extract-audio',
        '--audio-format', 'mp3'
      ], {}, function (err, output) {
        if (err) {
          return reject(err);
        }

        const duration = parseIsoDuration(songMetadata.contentDetails.duration);

        const song = new Song(duration, songMetadata.id, songMetadata.snippet.title);
        song.save();

        resolve(song);
      });
    });
  }

  static async getMetadata(songId: string): Promise<SongMetadata> {
    return new Promise<SongMetadata>((resolve, reject) => {
      request.get(`https://www.googleapis.com/youtube/v3/videos?id=${songId}&part=contentDetails,snippet&key=${appConfig.googleApiKey}`,
        (err, res) => {
          if (res.statusCode !== 204 && res.statusCode !== 200) {
            reject('Invalid googleApiKey or song\'s id');
          }

          const songMetadataResponse = <SongMetadataResponse>JSON.parse(res.body);
          resolve(songMetadataResponse.items[0]);
        });
    });
  }

  static async getSong(url: Url): Promise<Song> {
    const params = querystring.parse(url.query);
    let song = await Song.findOne<Song | null>({youtubeId: params.v});

    if (song && !fs.existsSync(song.filePath)) {
      try {
        await Song.remove(song._id);
        song = null;
      } catch (e) {
        console.log(e);
      }
    }

    return new Promise<Song>(async (resolve, reject) => {
      if (song) {
        return resolve(song);
      }

      try {
        const songMetadata = await SongService.getMetadata(params.v);
        song = await SongService.downloadSong(songMetadata);
        resolve(song);
      } catch (e) {
        reject(e);
      }
    });
  }
}
