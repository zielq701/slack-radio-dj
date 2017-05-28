import Timer = NodeJS.Timer;

export class Stopwatch {
  private startedAt: Date;
  private timer: Timer;

  constructor(private callback: () => void, private delay: number) {
    this.start();
  }

  clear(): void {
    clearTimeout(this.timer);
  }

  private start(): void {
    this.startedAt = new Date();
    this.timer = setTimeout(this.callback, this.delay);
  }

  timeLeft(): number {
    return new Date().getTime() - this.startedAt.getTime();
  }
}
