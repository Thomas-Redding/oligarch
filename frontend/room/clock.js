// Singleton class.
class Clock {
  constructor() {
    this._startTime = new Date();
    this._totalTime = 0;
    this._paused = false;
    setInterval(() => {
      this.update();
    }, 100);
  }
  set_time_remaining(timeRemaining) {
    this._startTime = new Date();
    this._totalTime = timeRemaining;
    this._paused = false;
    this.update();
  }
  pause() {
    this._totalTime = this._totalTime - (new Date() - this._startTime);
    this.startTime = new Date();
    this._paused = true;
  }
  update() {
    let timeElapsed = new Date() - this._startTime;
    if (this._paused) {
      timeElapsed = 0;
    }
    let secsRemaining = (this._totalTime - timeElapsed) / 1000;
    secsRemaining = Math.max(secsRemaining, 0);
    let minsRemaining = secsRemaining / 60 | 0;
    secsRemaining -= minsRemaining * 60;
    secsRemaining = Math.floor(secsRemaining) + '';
    if (secsRemaining.length === 1) {
      secsRemaining = '0' + secsRemaining;
    }
    statusBarTimeDiv.innerHTML = minsRemaining + ':' + secsRemaining;
  }
}

let gClock = new Clock();
