const restoreTargets = runtime => {
    for (const target of runtime.targets) {
        if (target.interpolationData) {
            runtime.renderer.updateDrawablePosition(target.drawableID, [
                target.x,
                target.y
            ]);
            const targetDirectionAndScale = target._getRenderedDirectionAndScale();
            runtime.renderer.updateDrawableDirectionScale(target.drawableID, targetDirectionAndScale.direction, targetDirectionAndScale.scale);
            runtime.renderer.updateDrawableEffect(target.drawableID, 'ghost', target.effects.ghost);
        }
    }
};

const setupTargets = runtime => {
    for (const target of runtime.targets) {
        if (target.visible && !target.isStage) {
            target.updateInterpolationData();
        }
    }
};

const interpolateTargets = runtime => {
    for (const target of runtime.targets) {
        const interpolationData = target.interpolationData;
        // Do not interpolate if no data.
        if (!interpolationData) {
            continue;
        }

        const costumeDidChange = interpolationData.costume !== target.currentCostume;
        const positionTolerance = costumeDidChange ? 10 : 50;

        const xDistance = Math.abs(target.x - interpolationData.x);
        const yDistance = Math.abs(target.y - interpolationData.y);
        // Do not interpolate when movement is large, as runtime is likely intended to be a teleport, not smooth movement.
        if (Math.sqrt((xDistance * xDistance) + (yDistance * yDistance)) < positionTolerance) {
            const newX = (interpolationData.x + target.x) / 2;
            const newY = (interpolationData.y + target.y) / 2;
            runtime.renderer.updateDrawablePosition(target.drawableID, [newX, newY]);
        }

        const ghostChange = Math.abs(target.effects.ghost - interpolationData.ghost);
        // Make sure we don't interpolate a change from 0 to 100 ghost or other large changes like that.
        if (ghostChange > 0 && ghostChange < 25) {
            const newGhost = (target.effects.ghost + interpolationData.ghost) / 2;
            runtime.renderer.updateDrawableEffect(target.drawableID, 'ghost', newGhost);
        }

        if (!costumeDidChange) {
            const targetDirectionAndScale = target._getRenderedDirectionAndScale();
            let direction = targetDirectionAndScale.direction;
            let scale = targetDirectionAndScale.scale;
            let updateDrawableDirectionScale = false;

            if (direction !== interpolationData.direction) {
                // The easiest way to find the average of two angles is using trig functions.
                const currentRadians = direction * Math.PI / 180;
                const startingRadians = interpolationData.direction * Math.PI / 180;
                direction = Math.atan2(
                    Math.sin(currentRadians) + Math.sin(startingRadians),
                    Math.cos(currentRadians) + Math.cos(startingRadians)
                ) * 180 / Math.PI;
                // TODO: do we have to clamp direction?
                // TODO: do not interpolate on large changes
                updateDrawableDirectionScale = true;
            }

            const startingScale = interpolationData.scale;
            if (scale[0] !== startingScale[0] || scale[1] !== startingScale[1]) {
                // Do not interpolate size when the sign of either scale differs.
                if (Math.sign(scale[0]) === Math.sign(startingScale[0]) && Math.sign(scale[1]) === Math.sign(startingScale[1])) {
                    const change = Math.abs(scale[0] - startingScale[0]);
                    // Only interpolate on small enough sizes. Anything larger is likely intended to be an instant change.
                    if (change < 100) {
                        scale = [
                            (scale[0] + startingScale[0]) / 2,
                            (scale[1] + startingScale[1]) / 2
                        ];
                        updateDrawableDirectionScale = true;
                    }
                }
            }

            if (updateDrawableDirectionScale) {
                runtime.renderer.updateDrawableDirectionScale(target.drawableID, direction, scale);
            }
        }
    }
};

module.exports = {
    restoreTargets,
    setupTargets,
    interpolateTargets
};
