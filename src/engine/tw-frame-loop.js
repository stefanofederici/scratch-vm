class FrameLoop {
    constructor () {
        this._interval = null;
    }

    isRunning () {
        return this._interval !== null;
    }

    start (fn, stepTime) {
        this.stepTime = stepTime;
        this._interval = setInterval(fn, stepTime);
    }

    stop () {
        clearInterval(this._interval);
        this._interval = null;
    }
}

module.exports = FrameLoop;
