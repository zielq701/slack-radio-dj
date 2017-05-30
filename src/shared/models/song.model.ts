import { appConfig } from '../../config';
import { DbModel, DbModelClass } from './db-model.model';
import { ModelProp } from './model.model';
import * as path from 'path';

@DbModelClass('songs')
export class Song extends DbModel {
  static className = 'Song';

  @ModelProp()
  duration: number;

  fileUrl: string;

  @ModelProp()
  lastPlayed: number;

  @ModelProp()
  videoId: string;

  @ModelProp()
  title: string;

  get filePath(): string {
    return path.join(appConfig.songsDirectory, this.videoId + '.mp3');
  }

  constructor(duration: number, videoId: string, title: string) {
    super();
    this.duration = duration;
    this.fileUrl = `${appConfig.songsUrl}/${this.videoId}.mp3`;
    this.videoId = videoId;
    this.title = title;
  }
}
