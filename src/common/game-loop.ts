// NOTE: performance resides in different places in Node and browsers.
/* eslint-disable @typescript-eslint/no-var-requires */
const performance =
  process.env.BROWSER === 'yes'
    ? window.performance
    : require('perf_hooks').performance;

// A generic game loop that will make sure to run an update function at a steady
// rate independently of the actual fps.
export default abstract class GameLoop {
  protected readonly ups: number;
  protected readonly fps: number;
  protected static readonly maxUpdateStep: number = 1000 / 4;

  private timeacc = 0;
  private prevNow = 0;
  public running = false;
  private startAccept?;

  private secondacc = 0;
  private updateCount = 0;
  public runningFPS = 0;

  constructor(ups?: number, fps?: number) {
    this.ups = 1000.0 / (ups || 30);
    this.fps = 1000.0 / (fps || 60);
  }

  protected update(): number {
    const now = performance.now();
    let step = now - this.prevNow;
    this.prevNow = now;

    if (step > Game.maxUpdateStep) {
      step = Game.maxUpdateStep;
      console.warn('skipped frames!');
    }
    this.timeacc += step;

    this.secondacc += step;
    this.updateCount += 1;
    if (this.secondacc >= 1000) {
      this.runningFPS = this.updateCount;
      this.updateCount = 0;
      this.secondacc -= 1000;
    }

    while (this.timeacc >= this.ups) {
      this.timeacc -= 1000 / this.ups;
      this.doUpdate();
    }

    this.afterUpdate();

    return performance.now() - now;
  }

  public start(): Promise<void> {
    return new Promise((accept, reject) => {
      this.running = true;
      this.timeacc = 0;
      this.prevNow = performance.now();
      this.startAccept = accept;
      this.timer();
    });
  }

  public stop(): void {
    this.running = false;
    this.startAccept();
    this.startAccept = undefined;
  }

  // a number in the range [0,1) specifying how far into the next update we are
  protected delta(): number {
    return this.timeacc / this.ups;
  }

  protected timer(prevStep?: number): void {
    setTimeout(() => {
      const step = this.update();
      if (this.running) this.timer(step);
    }, Math.max(0, this.fps - (prevStep || 0)));
  }

  abstract doUpdate(): void;
  abstract afterUpdate(): void;
}
