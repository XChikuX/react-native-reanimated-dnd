import React, { useEffect, useMemo, useRef, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring, withTiming, } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { getContentWidth, getItemXPosition, setHorizontalAutoScroll, setHorizontalPosition, } from "../components/sortableUtils";
import { HorizontalScrollDirection, } from "../types/sortable";
export function useHorizontalSortable(options) {
    const { id, positions, leftBound, autoScrollDirection, itemsCount, itemWidth, gap = 0, paddingHorizontal = 0, containerWidth = 500, onMove, onDragStart, onDrop, onDragging, children, handleComponent, } = options;
    const [isMoving, setIsMoving] = useState(false);
    const [hasHandle, setHasHandle] = useState(false);
    const movingSV = useSharedValue(false);
    const currentOverItemId = useSharedValue(null);
    const onDraggingLastCallTimestamp = useSharedValue(0);
    const THROTTLE_INTERVAL = 50;
    const initialLeftVal = useMemo(() => {
        const posArr = positions.get();
        const pos = posArr === null || posArr === void 0 ? void 0 : posArr[id];
        return getItemXPosition(pos, itemWidth, gap, paddingHorizontal);
    }, []);
    const initialLeftBoundVal = useMemo(() => {
        return leftBound.get();
    }, []);
    const positionX = useSharedValue(initialLeftVal);
    const left = useSharedValue(initialLeftVal);
    const targetLeftBound = useSharedValue(initialLeftBoundVal);
    const dragCtx = useSharedValue({
        initialItemContentX: 0,
        initialFingerAbsoluteX: 0,
        initialLeftBound: 0,
    });
    const calculatedContainerWidth = useRef(containerWidth).current;
    const rightBound = useDerivedValue(() => leftBound.value + calculatedContainerWidth);
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
                if (child.props && child.props.children) {
                    if (React.Children.toArray(child.props.children).some(checkForHandle)) {
                        return true;
                    }
                }
            }
            return false;
        };
        setHasHandle(React.Children.toArray(children).some(checkForHandle));
    }, [children, handleComponent]);
    useAnimatedReaction(() => positionX.value, (currentX, previousX) => {
        if (currentX === null || !movingSV.value) {
            return;
        }
        if (previousX !== null && currentX === previousX) {
            return;
        }
        const adjustedX = currentX - paddingHorizontal;
        const itemWithGapWidth = itemWidth + gap;
        const clampedPosition = Math.min(Math.max(0, Math.ceil(adjustedX / itemWithGapWidth)), itemsCount - 1);
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
                scheduleOnRN(onDragging, id, newOverItemId, Math.round(currentX));
                onDraggingLastCallTimestamp.value = now;
            }
        }
        left.value = currentX;
        setHorizontalPosition(currentX, itemsCount, positions, id, itemWidth, gap, paddingHorizontal);
        setHorizontalAutoScroll(currentX, leftBound.value, rightBound.value, itemWidth, autoScrollDirection);
    }, [
        movingSV,
        itemWidth,
        gap,
        paddingHorizontal,
        itemsCount,
        positions,
        id,
        onDragging,
        leftBound,
        rightBound,
        autoScrollDirection,
        currentOverItemId,
        left,
        onDraggingLastCallTimestamp,
    ]);
    useAnimatedReaction(() => positions.value[id], (currentPosition, previousPosition) => {
        if (currentPosition !== null &&
            previousPosition !== null &&
            currentPosition !== previousPosition) {
            if (!movingSV.value) {
                const newLeft = getItemXPosition(currentPosition, itemWidth, gap, paddingHorizontal);
                left.value = withSpring(newLeft);
                if (onMove) {
                    scheduleOnRN(onMove, id, previousPosition, currentPosition);
                }
            }
        }
    }, [movingSV, itemWidth, gap, paddingHorizontal]);
    useAnimatedReaction(() => autoScrollDirection.value, (scrollDirection, previousValue) => {
        if (scrollDirection !== null &&
            previousValue !== null &&
            scrollDirection !== previousValue) {
            switch (scrollDirection) {
                case HorizontalScrollDirection.Left: {
                    targetLeftBound.value = leftBound.value;
                    targetLeftBound.value = withTiming(0, { duration: 1500 });
                    break;
                }
                case HorizontalScrollDirection.Right: {
                    const contentWidth = getContentWidth(itemsCount, itemWidth, gap, paddingHorizontal);
                    const maxScroll = Math.max(0, contentWidth - calculatedContainerWidth);
                    targetLeftBound.value = leftBound.value;
                    targetLeftBound.value = withTiming(maxScroll, { duration: 1500 });
                    break;
                }
                case HorizontalScrollDirection.None: {
                    targetLeftBound.value = leftBound.value;
                    break;
                }
            }
        }
    });
    useAnimatedReaction(() => targetLeftBound.value, (targetLeftBoundValue, previousValue) => {
        if (targetLeftBoundValue !== null &&
            previousValue !== null &&
            targetLeftBoundValue !== previousValue) {
            if (movingSV.value) {
                leftBound.value = targetLeftBoundValue;
            }
        }
    }, [movingSV]);
    const panGestureHandler = Gesture.Pan()
        .activateAfterLongPress(200)
        .shouldCancelWhenOutside(false)
        .onStart((event) => {
        dragCtx.value = {
            initialItemContentX: getItemXPosition(positions.value[id], itemWidth, gap, paddingHorizontal),
            initialFingerAbsoluteX: event.absoluteX,
            initialLeftBound: leftBound.value,
        };
        positionX.value = dragCtx.value.initialItemContentX;
        movingSV.value = true;
        scheduleOnRN(setIsMoving, true);
        if (onDragStart) {
            scheduleOnRN(onDragStart, id, positions.value[id]);
        }
    })
        .onUpdate((event) => {
        const fingerDxScreen = event.absoluteX - dragCtx.value.initialFingerAbsoluteX;
        const scrollDeltaSinceStart = leftBound.value - dragCtx.value.initialLeftBound;
        positionX.value =
            dragCtx.value.initialItemContentX +
                fingerDxScreen +
                scrollDeltaSinceStart;
    })
        .onFinalize(() => {
        const finishPosition = getItemXPosition(positions.value[id], itemWidth, gap, paddingHorizontal);
        left.value = withTiming(finishPosition);
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
            top: 0,
            bottom: 0,
            left: left.value,
            width: itemWidth,
            zIndex: movingSV.value ? 1 : 0,
            backgroundColor: "transparent",
            shadowColor: "black",
            shadowOpacity: withSpring(movingSV.value ? 0.2 : 0),
            shadowRadius: 10,
        };
    }, [movingSV, itemWidth]);
    return {
        animatedStyle,
        panGestureHandler,
        isMoving,
        hasHandle,
    };
}
