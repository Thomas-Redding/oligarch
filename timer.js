
let DEBUG_LOG = true;

class Timer
{   
    constructor() {
        if (DEBUG_LOG) console.log("timer.constructor()");
        this._callback = () => {};
        this._startTime = 0;
        this._t = 0;
        this._is_running = false;
        this._id = undefined;
        this._is_paused = false;
        this._time_to_use_when_resumed = undefined;
    }
    /*
     * @param {number} time - number of milliseconds to wait
     * @param {function} callback - function to call when the timer expires
     */
    start(time, callback) {
        if (DEBUG_LOG) console.log("timer.start()", time, callback.name);
        this._callback = callback;
        this._startTime = new Date().getTime();
        this._t = time;
        this._is_running = true;
        this._id = setTimeout(() => {
            this._is_running = false; let c = this._callback; this._callback = () => {}; c();}, time);
    }
    /*
     * @returns {number} milliseconds until the timer expires
     */
    queryTime() {
        if (DEBUG_LOG) console.log("timer.queryTime()");
        let timeElapsed = new Date().getTime() - this._startTime;
        return this._t - timeElapsed;
    }
    /*
     * Set the number of milliseconds until the timer expires.
     * @param {number} newTime - milliseconds until the timer expires
     */
    extendTime(newTime) {
        if (DEBUG_LOG) console.log("timer.extendTime()", newTime);
        this._startTime = new Date().getTime();
        this._t = newTime;
        clearTimeout(this._id);
        this._id = setTimeout(() => {
            this._is_running = false; let c = this._callback; this._callback = () => {}; c();}, newTime);
    }

    /*
     * This method returns a boolean indicating whether the timer is counting
     * down. Note, if the timer is "paused" it may still be running. This method
     * just indicates whether the time is "counting down" when the game isn't
     * paused.
     *
     * returns {bool} whether the timer is running
     */
    isRunning() {
        if (DEBUG_LOG) console.log("timer.isRunning()");
        return this._is_running;
    }

    /*
     * Stop the timer from running.
     * @param {bool} do_callback - whether to call the `callback` given in
     * `start()`.
     */
    stop(do_callback) {
        if (DEBUG_LOG) console.log("timer.stop()", do_callback);
        this._is_running = false;
        if (do_callback) {
            let callback = this._callback;
            this._callback = () => {};
            clearTimeout(this._id);
            // if (callback) setTimeout(callback, 0);
            if (callback) callback();
        } else {
            this._callback = () => {};
            clearTimeout(this._id);
        }
    }

    pause() {
        if (DEBUG_LOG) console.log("timer.pause()");
        if (this._is_paused) return;
        this._is_paused = true;
        this._time_to_use_when_resumed = this.queryTime()
        clearTimeout(this._id);
    }

    resume() {
        if (DEBUG_LOG) console.log("timer.resume()");
        if (!this._is_paused) return;
        this._is_paused = false;
        this.extendTime(this._time_to_use_when_resumed)
        this._time_to_use_when_resumed = undefined;
    }

    isPaused() {
        if (DEBUG_LOG) console.log("timer.isPaused()");
        return this._is_paused;
    }
}

module.exports = Timer

