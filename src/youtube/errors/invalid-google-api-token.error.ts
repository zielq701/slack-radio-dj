export class InvalidGoogleApiTokenError extends Error {
  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidGoogleApiTokenError.prototype);
  }
}
