class FrameLoop {
    constructor () {
        this.running = false;
        this.stepTime = 1000;
        this.callback = () => {};
        this._interval = null;
    }

    isRunning () {
        return this.running;
    }

    start (callback, stepTime) {
        this.running = true;
        this.stepTime = stepTime;
        this.callback = callback;
        this._interval = setInterval(this.callback, stepTime);
    }

    stop () {
        this.running = false;
        clearInterval(this._interval);
    }
}

module.exports = FrameLoop;
