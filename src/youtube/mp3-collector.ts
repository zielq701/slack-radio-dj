import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';

import * as fs from 'fs';
import * as parseIsoDuration from 'parse-iso-duration';
import * as path from 'path';
import * as ytdl from 'youtube-dl';

import { appConfig } from '../config';
import { exec } from 'child_process';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Song } from '../shared/models/song.model';
import { Subject } from 'rxjs/Subject';
import { VideoMetadata } from './interfaces/video-metadata.interface';
import { YoutubeApi } from './youtube-api';
import { VideoTooLongError } from './errors/video-too-long.error';

export class Mp3Collector {
  private static downloadAndConvertVideo(songMetadata: VideoMetadata): Observable<Song> {
    const subject = new Subject<Song>();
    const duration = parseIsoDuration(songMetadata.contentDetails.duration);

    if (duration > appConfig.maxSongDurationToDownload) {
      subject.error(new VideoTooLongError(`Video can not be longer then ${appConfig.maxSongDurationToDownload / 1000} seconds`));
    } else {
      ytdl.exec(`https://www.youtube.com/watch?v=${songMetadata.id}`, [
        '--restrict-filenames',
        '--geo-bypass-country', 'PL',
        '-o', path.join(appConfig.songsDirectory, songMetadata.id + '.%(ext)s'),
        '--extract-audio',
        '--audio-format', 'mp3'
      ], {}, (err, output) => {
        if (err) {
          return subject.error(err);
        }

        const song = new Song(duration, songMetadata.id, songMetadata.snippet.title);
        Mp3Collector.normalizeMp3(song.filePath)
          .switchMap(() => {
            console.log(song);
            return song.save<Song>();
          })
          .subscribe(savedSong => {
            console.log(savedSong);
            subject.next(savedSong);
            subject.complete();
          }, error => {
            console.log(error);
          });
      });
    }

    return subject;
  }

  private static checkIfMp3ExistInFilesystemByVideoId(videoId: string): Observable<boolean> {
    const subject = new Subject<boolean>();

    fs.exists(path.join(appConfig.songsDirectory, videoId + '.mp3'), exists => {
      subject.next(exists);
      subject.complete();
    });

    return subject;
  }

  private static findSongInDbAndFilesystem(videoId: string): Observable<{ song: Song | null, existsInFilesystem: boolean }> {
    return Observable.forkJoin(
      Song.findOne<Song>({videoId: videoId}),
      Mp3Collector.checkIfMp3ExistInFilesystemByVideoId(videoId)
    ).map((res: [Song | null, boolean]) => {
      return {song: res[0], existsInFilesystem: res[1]};
    });
  }

  private static fetchMetadataFromYoutubeAndDownloadVideo(videoId: string): Observable<Song> {
    return YoutubeApi.getMetadataByVideoId(videoId)
      .switchMap((videoMetadata: VideoMetadata) => Mp3Collector.downloadAndConvertVideo(videoMetadata));
  }

  private static normalizeMp3(songPath: string): Observable<void> {
    const subject = new Subject<void>();

    exec(`mp3gain -c -p -r -d ${appConfig.mp3normalizationDb - 89} ${songPath}`, function (error, stdout, stderr) {
      if (error) {
        subject.error(error);
      }
      subject.next();
      subject.complete();
    });

    return subject;
  }

  static removeMp3FromFilesystemByVideoId(videoId: string): Observable<void> {
    const subject = new Subject<void>();

    fs.unlink(`${appConfig.songsUrl}/${videoId}.mp3`, error => {
      if (error) {
        return subject.error(error);
      }
      subject.next();
      subject.complete();
    });

    return subject;
  }

  static getSongByVideoId(videoId: string): Observable<Song> {
    return Mp3Collector.findSongInDbAndFilesystem(videoId)
      .switchMap(songData => {
        console.log(songData);
        if (songData.song && songData.existsInFilesystem) {
          return of(songData.song);
        }

        return Mp3Collector.fetchMetadataFromYoutubeAndDownloadVideo(videoId);
      });
  }
}
