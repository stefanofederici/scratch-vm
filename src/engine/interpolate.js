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

const hypotenuse = (a, b) => Math.sqrt((a * a) + (b * b));

const interpolateTargets = runtime => {
    for (const target of runtime.targets) {
        const interpolationData = target.interpolationData;
        // Do not interpolate if no data.
        if (!interpolationData) {
            continue;
        }

        const drawableID = target.drawableID;

        // Position interpolation.
        const xDistance = Math.abs(target.x - interpolationData.x);
        const yDistance = Math.abs(target.y - interpolationData.y);
        const totalPositionMovement = hypotenuse(xDistance, yDistance);
        if (totalPositionMovement > 0) {
            const bounds = runtime.renderer.getBounds(drawableID);

            // Tolerance is based on the diagonal length of the sprite.
            let positionTolerance = hypotenuse(bounds.width, bounds.height);
            if (positionTolerance < 10) positionTolerance = 10;
            if (positionTolerance > 50) positionTolerance = 50;

            // Large movements are probably intended to be teleports, not smooth motion.
            if (totalPositionMovement < positionTolerance) {
                const newX = (interpolationData.x + target.x) / 2;
                const newY = (interpolationData.y + target.y) / 2;
                runtime.renderer.updateDrawablePosition(drawableID, [newX, newY]);
            }
        }

        // Effect interpolation.
        const ghostChange = Math.abs(target.effects.ghost - interpolationData.ghost);
        // Make sure we don't interpolate a change from 0 to 100 ghost or other large changes.
        if (ghostChange > 0 && ghostChange < 25) {
            const newGhost = (target.effects.ghost + interpolationData.ghost) / 2;
            runtime.renderer.updateDrawableEffect(drawableID, 'ghost', newGhost);
        }

        // Interpolate scale and direction.
        const costumeDidChange = interpolationData.costume !== target.currentCostume;
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
                runtime.renderer.updateDrawableDirectionScale(drawableID, direction, scale);
            }
        }
    }
};

module.exports = {
    restoreTargets,
    setupTargets,
    interpolateTargets
};
