export class VideoTooLongError extends Error {
  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, VideoTooLongError.prototype);
  }
}
