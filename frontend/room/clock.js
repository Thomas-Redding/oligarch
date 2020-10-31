// Singleton class.
var Clock = (function () {
    function Clock() {
        var _this = this;
        this._startTime = new Date().getTime();
        this._totalTime = 0.0;
        this._paused = false;
        setInterval(function () {
            _this.update();
        }, 100);
    }
    Clock.prototype.set_time_remaining = function (timeRemaining) {
        this._startTime = new Date().getTime();
        this._totalTime = timeRemaining;
        this._paused = false;
        this.update();
    };
    Clock.prototype.pause = function () {
        var currentTime = new Date().getTime();
        this._totalTime -= currentTime - this._startTime;
        this._startTime = new Date().getTime();
        this._paused = true;
    };
    Clock.prototype.update = function () {
        var statusBarTimeDiv = document.getElementById("statusBarTimeDiv");
        if (!statusBarTimeDiv) {
            return;
        }
        var timeElapsed = new Date().getTime() - this._startTime;
        if (this._paused) {
            timeElapsed = 0;
        }
        var secsRemaining = (this._totalTime - timeElapsed) / 1000;
        secsRemaining = Math.max(secsRemaining, 0);
        var minsRemaining = secsRemaining / 60 | 0;
        secsRemaining -= minsRemaining * 60;
        var secsRemainingStr = Math.floor(secsRemaining) + '';
        if (secsRemainingStr.length === 1) {
            secsRemainingStr = '0' + secsRemainingStr;
        }
        statusBarTimeDiv.innerHTML = minsRemaining + ':' + secsRemainingStr;
    };
    return Clock;
})();
var gClock = new Clock();
