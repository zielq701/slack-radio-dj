import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import * as request from 'request';
import { appConfig } from '../config';
import { VideoMetadata } from './interfaces/video-metadata.interface';
import { VideoMetadataResponse } from './interfaces/video-metadata-response.interface';
import { InvalidGoogleApiTokenError } from './errors/invalid-google-api-token.error';
import { VideoNotExistsError } from './errors/video-not-exists.error';

export class YoutubeApi {
  /**
   * @throws {InvalidGoogleApiTokenError | VideoNotExistsError}
   * @param {string} videoId
   * @returns {Subject<VideoMetadata>}
   */
  static getMetadataByVideoId(videoId: string): Observable<VideoMetadata> {
    const subject = new Subject<VideoMetadata>();

    request.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${appConfig.googleApiKey}`,
      (err, res) => {
        if (err) {
          return subject.error(err);
        }

        if (!res.body) {
          return subject.error(new Error('YoutubeAPI response body is undefined'));
        }

        const body = JSON.parse(res.body);

        if (body.pageInfo.totalResults === 0) {
          return subject.error(new InvalidGoogleApiTokenError('Invalid googleApiKey'));
        } else if (body.code === 400) {
          return subject.error(new VideoNotExistsError('Invalid videoId'));
        }

        const videoMetadataResponse = <VideoMetadataResponse>JSON.parse(res.body);
        subject.next(videoMetadataResponse.items[0]);
        subject.complete();
      });

    return subject;
  }
}
