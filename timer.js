//game logic classes below
class Timer
{   
    constructor(time, callback) {
        this._callback = callback;
        this._startTime = new Date().getTime();
        this._t = time;
        this._is_running = true;
        this._id = setTimeout(() => {
            this._is_running = false; this._callback();}, time);
    }
    queryTime() {
        let timeElapsed = new Date().getTime() - this._startTime;
        return this._t - timeElapsed;
    }
    extendTime(newTime) {
        this._startTime = new Date().getTime();
        this._t = newTime;
        clearTimeout(this._id);
        this._id = setTimeout(() => {
            this._is_running = false; this._callback();}, time);
    }
    isRunning() {
        return this._is_running;
    }
    terminateTime(do_callback) {
        this._is_running = false;
        if (do_callback) {
            this._callback()
        }
        clearTimeout(this._id);
    }
}

module.exports = Timer

