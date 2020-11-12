export default class Key {
  value: string;
  isDown = false;
  isUp = true;
  press?: () => void = undefined;
  release?: () => void = undefined;
  downListener = this.downHandler.bind(this);
  upListener = this.upHandler.bind(this);
  constructor(value: string) {
    this.value = value;

    window.addEventListener('keydown', this.downListener, false);
    window.addEventListener('keyup', this.upListener, false);
  }

  downHandler(event: KeyboardEvent): void {
    if (event.key === this.value) {
      if (this.isUp) this.press?.();
      this.isDown = true;
      this.isUp = false;
      event.preventDefault();
    }
  }

  upHandler(event: KeyboardEvent): void {
    if (event.key === this.value) {
      if (this.isDown) this.release?.();
      this.isDown = false;
      this.isUp = true;
      event.preventDefault();
    }
  }

  unsubscribe(): void {
    window.removeEventListener('keydown', this.downListener);
    window.removeEventListener('keyup', this.upListener);
  }
}
