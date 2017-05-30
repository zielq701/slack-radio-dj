export class VideoNotExistsError extends Error {
  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, VideoNotExistsError.prototype);
  }
}
