import { VideoMetadata } from './video-metadata.interface';

export interface VideoMetadataResponse {
  kind: string;
  etag: string;
  id: string;
  items: [VideoMetadata];
}
