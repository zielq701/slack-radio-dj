import { SongMetadata } from './song-metadata.interface';

export interface SongMetadataResponse {
  kind: string;
  etag: string;
  id: string;
  items: [SongMetadata];
}
