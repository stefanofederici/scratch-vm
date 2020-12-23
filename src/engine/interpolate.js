const setupInitialState = runtime => {
    for (const target of runtime.targets) {
        if (target.visible && !target.isStage) {
            const directionAndScale = target._getRenderedDirectionAndScale();
            target.interpolationData = {
                x: target.x,
                y: target.y,
                direction: directionAndScale.direction,
                scale: directionAndScale.scale,
                costume: target.currentCostume,
                ghost: target.effects.ghost
            };
        } else {
            target.interpolationData = null;
        }
    }
};

/**
 * Interpolate the position of targets.
 * @param {Runtime} runtime The Runtime with targets to interpolate
 * @param {number} time Relative mid-frame time. [0-1]
 */
const interpolate = (runtime, time) => {
    const renderer = runtime.renderer;
    if (!renderer) {
        return;
    }
    for (const target of runtime.targets) {
        const interpolationData = target.interpolationData;
        // Do not interpolate if no data.
        if (!interpolationData) {
            continue;
        }

        const drawableID = target.drawableID;

        // Position interpolation.
        const xDistance = target.x - interpolationData.x;
        const yDistance = target.y - interpolationData.y;
        const absoluteXDistance = Math.abs(xDistance);
        const absoluteYDistance = Math.abs(yDistance);
        if (absoluteXDistance > 0.1 || absoluteYDistance > 0.1) {
            const drawable = renderer._allDrawables[drawableID];
            // getAABB is less accurate than getBounds, but it's much faster
            const bounds = drawable.getAABB();

            const xTolerance = Math.min(50, 10 + bounds.width);
            const yTolerance = Math.min(50, 10 + bounds.height);

            if (absoluteXDistance < xTolerance && absoluteYDistance < yTolerance) {
                const newX = interpolationData.x + xDistance * time;
                const newY = interpolationData.y + yDistance * time;
                renderer.updateDrawablePosition(drawableID, [newX, newY]);
            }
        }

        // Effect interpolation.
        const ghostChange = target.effects.ghost - interpolationData.ghost;
        const absoluteGhostChange = Math.abs(ghostChange);
        // Do not interpolate large effect changes. Anything large is probably intended to be instantaneous.
        if (absoluteGhostChange > 0 && absoluteGhostChange < 25) {
            const newGhost = target.effects.ghost + ghostChange * time;
            renderer.updateDrawableEffect(drawableID, 'ghost', newGhost);
        }

        // Interpolate scale and direction.
        const costumeDidChange = interpolationData.costume !== target.currentCostume;
        if (!costumeDidChange) {
            const targetDirectionAndScale = target._getRenderedDirectionAndScale();
            let direction = targetDirectionAndScale.direction;
            let scale = targetDirectionAndScale.scale;
            let updateDrawableDirectionScale = false;

            // Interpolate direction.
            if (direction !== interpolationData.direction) {
                // The easiest way to find the average of two angles is using trig functions.
                const currentRadians = direction * Math.PI / 180;
                const startingRadians = interpolationData.direction * Math.PI / 180;
                // TODO: interpolate using time
                direction = Math.atan2(
                    Math.sin(currentRadians) + Math.sin(startingRadians),
                    Math.cos(currentRadians) + Math.cos(startingRadians)
                ) * 180 / Math.PI;
                // TODO: do not interpolate on large changes
                updateDrawableDirectionScale = true;
            }

            // Interpolate scale.
            const startingScale = interpolationData.scale;
            if (scale[0] !== startingScale[0] || scale[1] !== startingScale[1]) {
                // Do not interpolate size when the sign of either scale differs.
                if (Math.sign(scale[0]) === Math.sign(startingScale[0]) && Math.sign(scale[1]) === Math.sign(startingScale[1])) {
                    const changeX = scale[0] - startingScale[0];
                    const changeY = scale[1] - startingScale[1];
                    const absoluteChangeX = Math.abs(changeX);
                    const absoluteChangeY = Math.abs(changeY);
                    // Only interpolate on small enough sizes. Anything larger is likely intended to be an instant change.
                    if (absoluteChangeX < 100 && absoluteChangeY < 100) {
                        scale = [
                            startingScale[0] + changeX * time,
                            startingScale[1] + changeY * time
                        ];
                        updateDrawableDirectionScale = true;
                    }
                }
            }

            if (updateDrawableDirectionScale) {
                renderer.updateDrawableDirectionScale(drawableID, direction, scale);
            }
        }
    }
};

module.exports = {
    setupInitialState,
    interpolate
};
