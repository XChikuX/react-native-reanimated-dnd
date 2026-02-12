import React, { useEffect, useMemo, useRef, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring, withTiming, } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
export var ScrollDirection;
(function (ScrollDirection) {
    ScrollDirection["None"] = "none";
    ScrollDirection["Up"] = "up";
    ScrollDirection["Down"] = "down";
})(ScrollDirection || (ScrollDirection = {}));
export function clamp(value, lowerBound, upperBound) {
    "worklet";
    return Math.max(lowerBound, Math.min(value, upperBound));
}
export function objectMove(object, from, to) {
    "worklet";
    const newObject = Object.assign({}, object);
    const movedUp = to < from;
    for (const id in object) {
        if (object[id] === from) {
            newObject[id] = to;
            continue;
        }
        const currentPosition = object[id];
        if (movedUp && currentPosition >= to && currentPosition < from) {
            newObject[id]++;
        }
        else if (currentPosition <= to && currentPosition > from) {
            newObject[id]--;
        }
    }
    return newObject;
}
export function listToObject(list) {
    const values = Object.values(list);
    const object = {};
    for (let i = 0; i < values.length; i++) {
        object[values[i].id] = i;
    }
    return object;
}
export function setPosition(positionY, itemsCount, positions, id, itemHeight) {
    "worklet";
    const newPosition = clamp(Math.floor(positionY / itemHeight), 0, itemsCount - 1);
    if (newPosition !== positions.value[id]) {
        positions.value = objectMove(positions.value, positions.value[id], newPosition);
    }
}
export function setAutoScroll(positionY, lowerBound, upperBound, scrollThreshold, autoScroll) {
    "worklet";
    if (positionY <= lowerBound + scrollThreshold) {
        autoScroll.value = ScrollDirection.Up;
    }
    else if (positionY >= upperBound - scrollThreshold) {
        autoScroll.value = ScrollDirection.Down;
    }
    else {
        autoScroll.value = ScrollDirection.None;
    }
}
export function useSortable(options) {
    const { id, positions, lowerBound, autoScrollDirection, itemsCount, itemHeight, containerHeight = 500, onMove, onDragStart, onDrop, onDragging, children, handleComponent, } = options;
    const [isMoving, setIsMoving] = useState(false);
    const [hasHandle, setHasHandle] = useState(false);
    const movingSV = useSharedValue(false);
    const currentOverItemId = useSharedValue(null);
    const onDraggingLastCallTimestamp = useSharedValue(0);
    const THROTTLE_INTERVAL = 50;
    const initialTopVal = useMemo(() => {
        const posArr = positions.get();
        const pos = posArr === null || posArr === void 0 ? void 0 : posArr[id];
        return pos * itemHeight;
    }, []);
    const initialLowerBoundVal = useMemo(() => {
        return lowerBound.get();
    }, []);
    const positionY = useSharedValue(initialTopVal);
    const top = useSharedValue(initialTopVal);
    const targetLowerBound = useSharedValue(initialLowerBoundVal);
    const dragCtx = useSharedValue({
        initialItemContentY: 0,
        initialFingerAbsoluteY: 0,
        initialLowerBound: 0,
    });
    const calculatedContainerHeight = useRef(containerHeight).current;
    const upperBound = useDerivedValue(() => lowerBound.value + calculatedContainerHeight);
    useEffect(() => {
        if (!children || !handleComponent) {
            setHasHandle(false);
            return;
        }
        const checkForHandle = (child) => {
            if (React.isValidElement(child)) {
                if (child.type === handleComponent) {
                    return true;
                }
                const childProps = child.props;
                if (childProps && childProps.children) {
                    if (React.Children.toArray(childProps.children).some(checkForHandle)) {
                        return true;
                    }
                }
            }
            return false;
        };
        setHasHandle(React.Children.toArray(children).some(checkForHandle));
    }, [children, handleComponent]);
    useAnimatedReaction(() => positionY.value, (currentY, previousY) => {
        if (currentY === null || !movingSV.value) {
            return;
        }
        if (previousY !== null && currentY === previousY) {
            return;
        }
        const clampedPosition = Math.min(Math.max(0, Math.ceil(currentY / itemHeight)), itemsCount - 1);
        let newOverItemId = null;
        for (const [itemIdIter, itemPosIter] of Object.entries(positions.value)) {
            if (itemPosIter === clampedPosition && itemIdIter !== id) {
                newOverItemId = itemIdIter;
                break;
            }
        }
        if (currentOverItemId.value !== newOverItemId) {
            currentOverItemId.value = newOverItemId;
        }
        if (onDragging) {
            const now = Date.now();
            if (now - onDraggingLastCallTimestamp.value > THROTTLE_INTERVAL) {
                scheduleOnRN(onDragging, id, newOverItemId, Math.round(currentY));
                onDraggingLastCallTimestamp.value = now;
            }
        }
        top.value = currentY;
        setPosition(currentY, itemsCount, positions, id, itemHeight);
        setAutoScroll(currentY, lowerBound.value, upperBound.value, itemHeight, autoScrollDirection);
    }, [
        movingSV,
        itemHeight,
        itemsCount,
        positions,
        id,
        onDragging,
        lowerBound,
        upperBound,
        autoScrollDirection,
        currentOverItemId,
        top,
        onDraggingLastCallTimestamp,
    ]);
    useAnimatedReaction(() => positions.value[id], (currentPosition, previousPosition) => {
        if (currentPosition !== null &&
            previousPosition !== null &&
            currentPosition !== previousPosition) {
            if (!movingSV.value) {
                top.value = withSpring(currentPosition * itemHeight);
                if (onMove) {
                    scheduleOnRN(onMove, id, previousPosition, currentPosition);
                }
            }
        }
    }, [movingSV]);
    useAnimatedReaction(() => autoScrollDirection.value, (scrollDirection, previousValue) => {
        if (scrollDirection !== null &&
            previousValue !== null &&
            scrollDirection !== previousValue) {
            switch (scrollDirection) {
                case ScrollDirection.Up: {
                    targetLowerBound.value = lowerBound.value;
                    targetLowerBound.value = withTiming(0, { duration: 1500 });
                    break;
                }
                case ScrollDirection.Down: {
                    const contentHeight = itemsCount * itemHeight;
                    const maxScroll = contentHeight - calculatedContainerHeight;
                    targetLowerBound.value = lowerBound.value;
                    targetLowerBound.value = withTiming(maxScroll, { duration: 1500 });
                    break;
                }
                case ScrollDirection.None: {
                    targetLowerBound.value = lowerBound.value;
                    break;
                }
            }
        }
    });
    useAnimatedReaction(() => targetLowerBound.value, (targetLowerBoundValue, previousValue) => {
        if (targetLowerBoundValue !== null &&
            previousValue !== null &&
            targetLowerBoundValue !== previousValue) {
            if (movingSV.value) {
                lowerBound.value = targetLowerBoundValue;
            }
        }
    }, [movingSV]);
    const panGestureHandler = Gesture.Pan()
        .activateAfterLongPress(200)
        .shouldCancelWhenOutside(false)
        .onStart((event) => {
        dragCtx.value = {
            initialItemContentY: positions.value[id] * itemHeight,
            initialFingerAbsoluteY: event.absoluteY,
            initialLowerBound: lowerBound.value,
        };
        positionY.value = dragCtx.value.initialItemContentY;
        movingSV.value = true;
        scheduleOnRN(setIsMoving, true);
        if (onDragStart) {
            scheduleOnRN(onDragStart, id, positions.value[id]);
        }
    })
        .onUpdate((event) => {
        const fingerDyScreen = event.absoluteY - dragCtx.value.initialFingerAbsoluteY;
        const scrollDeltaSinceStart = lowerBound.value - dragCtx.value.initialLowerBound;
        positionY.value =
            dragCtx.value.initialItemContentY +
                fingerDyScreen +
                scrollDeltaSinceStart;
    })
        .onFinalize(() => {
        const finishPosition = positions.value[id] * itemHeight;
        top.value = withTiming(finishPosition);
        movingSV.value = false;
        scheduleOnRN(setIsMoving, false);
        if (onDrop) {
            const positionsCopy = { ...positions.value };
            scheduleOnRN(onDrop, id, positions.value[id], positionsCopy);
        }
        currentOverItemId.value = null;
    });
    const animatedStyle = useAnimatedStyle(() => {
        "worklet";
        return {
            position: "absolute",
            left: 0,
            right: 0,
            top: top.value,
            zIndex: movingSV.value ? 1 : 0,
            backgroundColor: "#000000",
            shadowColor: "black",
            shadowOpacity: withSpring(movingSV.value ? 0.2 : 0),
            shadowRadius: 10,
        };
    }, [movingSV]);
    return {
        animatedStyle,
        panGestureHandler,
        isMoving,
        hasHandle,
    };
}
