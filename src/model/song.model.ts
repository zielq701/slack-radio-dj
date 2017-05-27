import { Model, ModelClass, ModelProp } from './model.model';
import { appConfig } from '../config';
import * as path from 'path';

@ModelClass('songs')
export class Song extends Model {
  @ModelProp()
  duration: number;

  @ModelProp()
  lastPlayed: number;

  @ModelProp()
  youtubeId: string;

  @ModelProp()
  title: string;

  get filePath(): string {
    return path.join(appConfig.songsDirectory, this.youtubeId + '.mp3');
  }

  get fileUrl(): string {
    return `${appConfig.songsUrl}/${this.youtubeId}.mp3`;
  }

  constructor(duration: number, youtubeId: string, title: string) {
    super();
    this.youtubeId = youtubeId;
    this.duration = duration;
    this.title = title;
  }
}
