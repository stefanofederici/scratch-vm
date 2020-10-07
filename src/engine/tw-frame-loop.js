class FrameLoop {
    constructor () {
        this.running = false;
        this.stepTime = 1000;
        this.callback = () => {};
        this._interval = null;
        this._nextAnimationFrame = null;
        this.handleAnimationFrame = this.handleAnimationFrame.bind(this);
        this.lastFrameTime = null;
        this.timeToNextFrame = null;
    }

    isRunning () {
        return this.running;
    }

    handleAnimationFrame (time) {
        this._nextAnimationFrame = requestAnimationFrame(this.handleAnimationFrame);

        if (this.lastFrameTime === null) {
            this.lastFrameTime = time;
        }

        const deltaTime = time - this.lastFrameTime;
        this.lastFrameTime = time;

        this.timeToNextFrame -= deltaTime;

        if (this.timeToNextFrame <= 0) {
            this.timeToNextFrame += this.stepTime;
            if (this.timeToNextFrame < -this.stepTime) {
                this.timeToNextFrame = -this.stepTime;
            }
            this.callback();
        }
    }

    start (callback, stepTime) {
        this.running = true;
        this.stepTime = stepTime;
        this.callback = callback;
        // requestAnimationFrame is not available in Node
        if (typeof requestAnimationFrame === 'undefined') {
            this._interval = setInterval(callback, stepTime);
        } else {
            this.lastFrameTime = null;
            this.timeToNextFrame = 0;
            this._nextAnimationFrame = requestAnimationFrame(this.handleAnimationFrame);
        }
    }

    stop () {
        this.running = false;
        if (this._interval !== null) {
            clearInterval(this._interval);
            this._interval = null;
        }
        if (this._nextAnimationFrame !== null) {
            cancelAnimationFrame(this._nextAnimationFrame);
            this._interval = null;
        }
    }
}

module.exports = FrameLoop;
