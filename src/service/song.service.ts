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
import { exec } from 'child_process';

export class SongService {
  private static async normalizeMp3(songPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      exec(`mp3gain -c -p -r -d ${appConfig.mp3normalizationDb - 89} ${songPath}`, function (error, stdout, stderr) {
        if (error) {
          reject(error);
        }

        resolve();
      });
    });
  }

  private static async downloadSong(songMetadata: SongMetadata): Promise<Song> {
    return new Promise<Song>((resolve, reject) => {
      const duration = parseIsoDuration(songMetadata.contentDetails.duration);
      if (duration > appConfig.maxSongDurationToDownload) {
        return reject('Song is to long');
      }

      ytdl.exec(`https://www.youtube.com/watch?v=${songMetadata.id}`, [
        '--restrict-filenames',
        '--geo-bypass-country', 'PL',
        '-o', path.join(appConfig.songsDirectory, songMetadata.id + '.%(ext)s'),
        '--extract-audio',
        '--audio-format', 'mp3'
      ], {}, async (err, output) => {
        if (err) {
          return reject(err);
        }

        const song = new Song(duration, songMetadata.id, songMetadata.snippet.title);

        try {
          await SongService.normalizeMp3(song.filePath);
        } catch (e) {
          console.log(e);
        }

        song.save();

        resolve(song);
      });
    });
  }

  static async getMetadata(songId: string): Promise<SongMetadata> {
    return new Promise<SongMetadata>((resolve, reject) => {
      request.get(`https://www.googleapis.com/youtube/v3/videos?id=${songId}&part=contentDetails,snippet&key=${appConfig.googleApiKey}`,
        (err, res) => {
          if ((res.statusCode !== 204 && res.statusCode !== 200) || JSON.parse(res.body).pageInfo.totalResults === 0) {
            return reject('Invalid googleApiKey or song\'s id');
          }

          const songMetadataResponse = <SongMetadataResponse>JSON.parse(res.body);
          resolve(songMetadataResponse.items[0]);
        });
    });
  }

  static async getSong(url: Url): Promise<Song> {
    return new Promise<Song>(async (resolve, reject) => {
      const params = querystring.parse(url.query);

      if (!params.v) {
        return reject('Bad url');
      }

      let song = await Song.findOne<Song | null>({youtubeId: params.v});

      if (song && !fs.existsSync(song.filePath)) {
        try {
          await Song.remove(song._id);
          song = null;
        } catch (e) {
          console.log(e);
        }
      }

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
