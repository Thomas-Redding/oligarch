// Singleton class.
class Clock {
  _startTime: number;
  _totalTime: number;
  _paused: boolean;
  constructor() {
    this._startTime = new Date().getTime();
    this._totalTime = 0.0;
    this._paused = false;
    setInterval(() => {
      this.update();
    }, 100);
  }
  set_time_remaining(timeRemaining : number) {
    this._startTime = new Date().getTime();
    this._totalTime = timeRemaining;
    this._paused = false;
    this.update();
  }
  pause() {
    let currentTime : number = new Date().getTime();
    this._totalTime -= currentTime - this._startTime;
    this._startTime = new Date().getTime();
    this._paused = true;
  }
  update() {
    let statusBarTimeDiv : HTMLElement = document.getElementById("statusBarTimeDiv");
    if (!statusBarTimeDiv) {
      return;
    }
    let timeElapsed : number = new Date().getTime() - this._startTime;
    if (this._paused) {
      timeElapsed = 0;
    }
    let secsRemaining : number = (this._totalTime - timeElapsed) / 1000;
    secsRemaining = Math.max(secsRemaining, 0);
    let minsRemaining = secsRemaining / 60 | 0;
    secsRemaining -= minsRemaining * 60;
    let secsRemainingStr : string = Math.floor(secsRemaining) + '';
    if (secsRemainingStr.length === 1) {
      secsRemainingStr = '0' + secsRemainingStr;
    }
    statusBarTimeDiv.innerHTML = minsRemaining + ':' + secsRemainingStr;
  }
}

let gClock = new Clock();
