import React, { useCallback, useContext, useEffect, useRef, useState, } from "react";
import { Gesture, } from "react-native-gesture-handler";
import { measure, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useSharedValue, withSpring, } from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { useDragOverlay } from "../context/DragOverlayContext";
import { SlotsContext, } from "../types/context";
import { DraggableState, } from "../types/draggable";
export const useDraggable = (options) => {
    const { data, draggableId, dragDisabled = false, preDragDelay = 0, onDragStart, onDragEnd, onDragging, onStateChange, animationFunction, dragBoundsRef, dragAxis = "both", collisionAlgorithm = "intersect", children, handleComponent, } = options;
    const animatedViewRef = useAnimatedRef();
    const [state, setState] = useState(DraggableState.IDLE);
    const [hasHandle, setHasHandle] = useState(false);
    let showDragOverlay, hideDragOverlay, updateDragOverlayPosition;
    let useDragOverlaySystem = false;
    try {
        const overlayContext = useDragOverlay();
        showDragOverlay = overlayContext.showDragOverlay;
        hideDragOverlay = overlayContext.hideDragOverlay;
        updateDragOverlayPosition = overlayContext.updateDragOverlayPosition;
        useDragOverlaySystem = true;
    }
    catch (error) {
        showDragOverlay = () => { };
        hideDragOverlay = () => { };
        updateDragOverlayPosition = () => { };
        useDragOverlaySystem = false;
    }
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
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);
    const dragDisabledShared = useSharedValue(dragDisabled);
    const dragAxisShared = useSharedValue(dragAxis);
    const preDragDelayShared = useSharedValue(preDragDelay);
    const isDraggingShared = useSharedValue(0);
    useEffect(() => {
        onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange(state);
        isDraggingShared.value = state === DraggableState.DRAGGING ? 1 : 0;
    }, [state, onStateChange, isDraggingShared]);
    const originX = useSharedValue(0);
    const originY = useSharedValue(0);
    const itemW = useSharedValue(0);
    const itemH = useSharedValue(0);
    const isOriginSet = useRef(false);
    const internalDraggableId = useRef(draggableId || `draggable-${Math.random().toString(36).substr(2, 9)}`).current;
    const boundsX = useSharedValue(0);
    const boundsY = useSharedValue(0);
    const boundsWidth = useSharedValue(0);
    const boundsHeight = useSharedValue(0);
    const boundsAreSet = useSharedValue(false);
    const { getSlots, setActiveHoverSlot, activeHoverSlotId, registerPositionUpdateListener, unregisterPositionUpdateListener, registerDroppedItem, unregisterDroppedItem, hasAvailableCapacity, onDragging: contextOnDragging, onDragStart: contextOnDragStart, onDragEnd: contextOnDragEnd, } = useContext(SlotsContext);
    useEffect(() => {
        preDragDelayShared.value = preDragDelay;
    }, [preDragDelay, preDragDelayShared]);
    useEffect(() => {
        dragDisabledShared.value = dragDisabled;
    }, [dragDisabled, dragDisabledShared]);
    useEffect(() => {
        dragAxisShared.value = dragAxis;
    }, [dragAxis, dragAxisShared]);
    const updateDraggablePosition = useCallback(() => {
        scheduleOnUI(() => {
            const measurement = measure(animatedViewRef);
            if (measurement === null) {
                return;
            }
            const currentTx = tx.value;
            const currentTy = ty.value;
            if (currentTx === 0 && currentTy === 0) {
                const newOriginX = measurement.pageX - currentTx;
                const newOriginY = measurement.pageY - currentTy;
                originX.value = newOriginX;
                originY.value = newOriginY;
            }
            itemW.value = measurement.width;
            itemH.value = measurement.height;
            if (!isOriginSet.current) {
                isOriginSet.current = true;
            }
        });
    }, [animatedViewRef, originX, originY, itemW, itemH, tx, ty]);
    const updateDraggablePositionWorklet = useCallback(() => {
        "worklet";
        const measurement = measure(animatedViewRef);
        if (measurement === null) {
            return;
        }
        const currentTx = tx.value;
        const currentTy = ty.value;
        if (currentTx === 0 && currentTy === 0) {
            const newOriginX = measurement.pageX - currentTx;
            const newOriginY = measurement.pageY - currentTy;
            originX.value = newOriginX;
            originY.value = newOriginY;
        }
        itemW.value = measurement.width;
        itemH.value = measurement.height;
        if (!isOriginSet.current) {
            isOriginSet.current = true;
        }
    }, [animatedViewRef, originX, originY, itemW, itemH, tx, ty]);
    const updateBounds = useCallback(() => {
        const currentBoundsView = dragBoundsRef === null || dragBoundsRef === void 0 ? void 0 : dragBoundsRef.current;
        if (currentBoundsView) {
            currentBoundsView.measure((_x, _y, width, height, pageX, pageY) => {
                if (typeof pageX === "number" &&
                    typeof pageY === "number" &&
                    width > 0 &&
                    height > 0) {
                    scheduleOnUI(() => {
                        boundsX.value = pageX;
                        boundsY.value = pageY;
                        boundsWidth.value = width;
                        boundsHeight.value = height;
                        if (!boundsAreSet.value) {
                            boundsAreSet.value = true;
                        }
                    });
                }
                else {
                    console.warn("useDraggable: dragBoundsRef measurement failed or returned invalid dimensions. Bounds may be stale or item unbounded.");
                }
            });
        }
        else {
            scheduleOnUI(() => {
                if (boundsAreSet.value) {
                    boundsAreSet.value = false;
                }
            });
        }
    }, [
        dragBoundsRef,
        boundsX,
        boundsY,
        boundsWidth,
        boundsHeight,
        boundsAreSet,
    ]);
    useEffect(() => {
        const handlePositionUpdate = () => {
            updateDraggablePosition();
            updateBounds();
        };
        registerPositionUpdateListener(internalDraggableId, handlePositionUpdate);
        return () => {
            unregisterPositionUpdateListener(internalDraggableId);
        };
    }, [
        internalDraggableId,
        registerPositionUpdateListener,
        unregisterPositionUpdateListener,
        updateDraggablePosition,
        updateBounds,
    ]);
    useEffect(() => {
        updateBounds();
    }, [updateBounds]);
    const handleLayoutHandler = useCallback((event) => {
        updateDraggablePosition();
    }, [updateDraggablePosition]);
    const animateDragEndPosition = useCallback((targetXValue, targetYValue) => {
        "worklet";
        if (animationFunction) {
            tx.value = animationFunction(targetXValue);
            ty.value = animationFunction(targetYValue);
        }
        else {
            tx.value = withSpring(targetXValue);
            ty.value = withSpring(targetYValue);
        }
    }, [animationFunction, tx, ty]);
    const performCollisionCheck = useCallback((draggableX, draggableY, draggableW, draggableH, slot, algo) => {
        if (algo === "intersect") {
            return (draggableX < slot.x + slot.width &&
                draggableX + draggableW > slot.x &&
                draggableY < slot.y + slot.height &&
                draggableY + draggableH > slot.y);
        }
        else if (algo === "contain") {
            return (draggableX >= slot.x &&
                draggableX + draggableW <= slot.x + slot.width &&
                draggableY >= slot.y &&
                draggableY + draggableH <= slot.y + slot.height);
        }
        else {
            const draggableCenterX = draggableX + draggableW / 2;
            const draggableCenterY = draggableY + draggableH / 2;
            return (draggableCenterX >= slot.x &&
                draggableCenterX <= slot.x + slot.width &&
                draggableCenterY >= slot.y &&
                draggableCenterY <= slot.y + slot.height);
        }
    }, []);
    const processDropAndAnimate = useCallback((currentTxVal, currentTyVal, draggableData, currentOriginX, currentOriginY, currentItemW, currentItemH) => {
        const slots = getSlots();
        const currentDraggableX = currentOriginX + currentTxVal;
        const currentDraggableY = currentOriginY + currentTyVal;
        let hitSlotData = null;
        let hitSlotId = null;
        for (const key in slots) {
            const slotId = parseInt(key, 10);
            const s = slots[slotId];
            const isCollision = performCollisionCheck(currentDraggableX, currentDraggableY, currentItemW, currentItemH, s, collisionAlgorithm);
            if (isCollision) {
                const hasCapacity = hasAvailableCapacity(s.id);
                if (hasCapacity) {
                    hitSlotData = s;
                    hitSlotId = slotId;
                    break;
                }
            }
        }
        let finalTxValue;
        let finalTyValue;
        if (hitSlotData && hitSlotId !== null) {
            if (hitSlotData.onDrop) {
                scheduleOnRN(hitSlotData.onDrop, draggableData);
            }
            scheduleOnRN(registerDroppedItem, internalDraggableId, hitSlotData.id, draggableData);
            scheduleOnRN(setState, DraggableState.DROPPED);
            const alignment = hitSlotData.dropAlignment || "center";
            const offset = hitSlotData.dropOffset || { x: 0, y: 0 };
            let targetX = 0;
            let targetY = 0;
            switch (alignment) {
                case "top-left":
                    targetX = hitSlotData.x;
                    targetY = hitSlotData.y;
                    break;
                case "top-center":
                    targetX = hitSlotData.x + hitSlotData.width / 2 - currentItemW / 2;
                    targetY = hitSlotData.y;
                    break;
                case "top-right":
                    targetX = hitSlotData.x + hitSlotData.width - currentItemW;
                    targetY = hitSlotData.y;
                    break;
                case "center-left":
                    targetX = hitSlotData.x;
                    targetY = hitSlotData.y + hitSlotData.height / 2 - currentItemH / 2;
                    break;
                case "center":
                    targetX = hitSlotData.x + hitSlotData.width / 2 - currentItemW / 2;
                    targetY = hitSlotData.y + hitSlotData.height / 2 - currentItemH / 2;
                    break;
                case "center-right":
                    targetX = hitSlotData.x + hitSlotData.width - currentItemW;
                    targetY = hitSlotData.y + hitSlotData.height / 2 - currentItemH / 2;
                    break;
                case "bottom-left":
                    targetX = hitSlotData.x;
                    targetY = hitSlotData.y + hitSlotData.height - currentItemH;
                    break;
                case "bottom-center":
                    targetX = hitSlotData.x + hitSlotData.width / 2 - currentItemW / 2;
                    targetY = hitSlotData.y + hitSlotData.height - currentItemH;
                    break;
                case "bottom-right":
                    targetX = hitSlotData.x + hitSlotData.width - currentItemW;
                    targetY = hitSlotData.y + hitSlotData.height - currentItemH;
                    break;
                default:
                    targetX = hitSlotData.x + hitSlotData.width / 2 - currentItemW / 2;
                    targetY = hitSlotData.y + hitSlotData.height / 2 - currentItemH / 2;
            }
            const draggableTargetX = targetX + offset.x;
            const draggableTargetY = targetY + offset.y;
            finalTxValue = draggableTargetX - currentOriginX;
            finalTyValue = draggableTargetY - currentOriginY;
        }
        else {
            finalTxValue = 0;
            finalTyValue = 0;
            scheduleOnRN(setState, DraggableState.IDLE);
            scheduleOnRN(unregisterDroppedItem, internalDraggableId);
        }
        scheduleOnUI(animateDragEndPosition, finalTxValue, finalTyValue);
    }, [
        getSlots,
        animateDragEndPosition,
        collisionAlgorithm,
        performCollisionCheck,
        setState,
        internalDraggableId,
        registerDroppedItem,
        unregisterDroppedItem,
        hasAvailableCapacity,
    ]);
    const updateHoverState = useCallback((currentTxVal, currentTyVal, currentOriginX, currentOriginY, currentItemW, currentItemH) => {
        const slots = getSlots();
        const currentDraggableX = currentOriginX + currentTxVal;
        const currentDraggableY = currentOriginY + currentTyVal;
        let newHoveredSlotId = null;
        for (const key in slots) {
            const slotId = parseInt(key, 10);
            const s = slots[slotId];
            const isCollision = performCollisionCheck(currentDraggableX, currentDraggableY, currentItemW, currentItemH, s, collisionAlgorithm);
            if (isCollision) {
                newHoveredSlotId = slotId;
                break;
            }
        }
        if (activeHoverSlotId !== newHoveredSlotId) {
            setActiveHoverSlot(newHoveredSlotId);
        }
    }, [
        getSlots,
        setActiveHoverSlot,
        activeHoverSlotId,
        collisionAlgorithm,
        performCollisionCheck,
    ]);
    const gesture = React.useMemo(() => Gesture.Pan()
        .activateAfterLongPress(preDragDelay > 0 ? preDragDelay : undefined)
        .onStart(() => {
        "worklet";
        updateDraggablePositionWorklet();
        if (dragDisabledShared.value)
            return;
        offsetX.value = tx.value;
        offsetY.value = ty.value;
        isDraggingShared.value = 1;
        scheduleOnRN(setState, DraggableState.DRAGGING);
        if (useDragOverlaySystem) {
            const initialX = originX.value;
            const initialY = originY.value;
            scheduleOnRN(showDragOverlay, draggableId || `draggable-${Date.now()}`, data, { x: initialX, y: initialY });
        }
        if (onDragStart)
            scheduleOnRN(onDragStart, data);
        if (contextOnDragStart)
            scheduleOnRN(contextOnDragStart, data);
    })
        .onUpdate((event) => {
        "worklet";
        if (dragDisabledShared.value)
            return;
        let newTx = offsetX.value + event.translationX;
        let newTy = offsetY.value + event.translationY;
        if (boundsAreSet.value) {
            const currentItemW = itemW.value;
            const currentItemH = itemH.value;
            const minTx = boundsX.value - originX.value;
            const maxTx = boundsX.value + boundsWidth.value - originX.value - currentItemW;
            const minTy = boundsY.value - originY.value;
            const maxTy = boundsY.value + boundsHeight.value - originY.value - currentItemH;
            newTx = Math.max(minTx, Math.min(newTx, maxTx));
            newTy = Math.max(minTy, Math.min(newTy, maxTy));
        }
        if (dragAxisShared.value === "x") {
            tx.value = newTx;
        }
        else if (dragAxisShared.value === "y") {
            ty.value = newTy;
        }
        else {
            tx.value = newTx;
            ty.value = newTy;
        }
        if (onDragging) {
            scheduleOnRN(onDragging, {
                x: originX.value,
                y: originY.value,
                tx: tx.value,
                ty: ty.value,
                itemData: data,
            });
        }
        if (contextOnDragging) {
            scheduleOnRN(contextOnDragging, {
                x: originX.value,
                y: originY.value,
                tx: tx.value,
                ty: ty.value,
                itemData: data,
            });
        }
        if (useDragOverlaySystem) {
            const currentPageX = originX.value + tx.value;
            const currentPageY = originY.value + ty.value;
            scheduleOnRN(updateDragOverlayPosition, {
                x: currentPageX,
                y: currentPageY,
            });
        }
        scheduleOnRN(updateHoverState, tx.value, ty.value, originX.value, originY.value, itemW.value, itemH.value);
    })
        .onEnd(() => {
        "worklet";
        if (dragDisabledShared.value)
            return;
        isDraggingShared.value = 0;
        if (useDragOverlaySystem) {
            scheduleOnRN(hideDragOverlay);
        }
        if (onDragEnd)
            scheduleOnRN(onDragEnd, data);
        if (contextOnDragEnd)
            scheduleOnRN(contextOnDragEnd, data);
        scheduleOnRN(processDropAndAnimate, tx.value, ty.value, data, originX.value, originY.value, itemW.value, itemH.value);
        scheduleOnRN(setActiveHoverSlot, null);
    }), [
        dragDisabledShared,
        offsetX,
        offsetY,
        tx,
        ty,
        originX,
        originY,
        itemW,
        itemH,
        onDragStart,
        onDragEnd,
        data,
        processDropAndAnimate,
        updateHoverState,
        setActiveHoverSlot,
        animationFunction,
        onDragging,
        boundsAreSet,
        boundsX,
        boundsY,
        boundsWidth,
        boundsHeight,
        dragAxisShared,
        setState,
        updateDraggablePositionWorklet,
        contextOnDragging,
        contextOnDragStart,
        contextOnDragEnd,
        isDraggingShared,
    ]);
    const animatedStyleProp = useAnimatedStyle(() => {
        "worklet";
        const isDragging = isDraggingShared.value === 1;
        const shouldHide = useDragOverlaySystem && isDragging;
        return {
            transform: [{ translateX: tx.value }, { translateY: ty.value }],
            opacity: shouldHide ? 0 : 1,
            zIndex: !useDragOverlaySystem && isDragging ? 9999 : 1,
            elevation: !useDragOverlaySystem && isDragging ? 9999 : 1,
        };
    }, [tx, ty, isDraggingShared, useDragOverlaySystem]);
    useAnimatedReaction(() => {
        return {
            txValue: tx.value,
            tyValue: ty.value,
            isZero: tx.value === 0 && ty.value === 0,
        };
    }, (result, previous) => {
        if (result.isZero && previous && !previous.isZero) {
            isDraggingShared.value = 0;
            scheduleOnRN(setState, DraggableState.IDLE);
            scheduleOnRN(unregisterDroppedItem, internalDraggableId);
            scheduleOnRN(hideDragOverlay);
        }
    }, [setState, unregisterDroppedItem, internalDraggableId, hideDragOverlay]);
    useEffect(() => {
        return () => {
            unregisterDroppedItem(internalDraggableId);
        };
    }, [internalDraggableId, unregisterDroppedItem]);
    return {
        animatedViewProps: {
            style: animatedStyleProp,
            onLayout: handleLayoutHandler,
        },
        gesture,
        state,
        animatedViewRef,
        hasHandle,
    };
};
