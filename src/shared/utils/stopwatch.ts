import Timer = NodeJS.Timer;

export class Stopwatch {
  private startedAt: Date;
  private timer: Timer;
  private _isCompleted = false;

  constructor(private callback: () => void, private delay: number) {
    this.start();
  }

  get isCompleted(): boolean {
    return this._isCompleted;
  }

  get timeLeft(): number {
    if (this._isCompleted) {
      return 0;
    }

    return new Date().getTime() - this.startedAt.getTime();
  }

  clear(): void {
    if (this._isCompleted) {
      return;
    }

    clearTimeout(this.timer);
  }

  private start(): void {
    this.startedAt = new Date();
    this.timer = setTimeout(() => {
      this._isCompleted = true;
      this.callback();
    }, this.delay);
  }
}
