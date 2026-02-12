import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { measure, useAnimatedRef } from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { SlotsContext, } from "../types/context";
let _nextDroppableId = 1;
const _getUniqueDroppableId = () => {
    return _nextDroppableId++;
};
export const useDroppable = (options) => {
    const { onDrop, dropDisabled, onActiveChange, dropAlignment, dropOffset, activeStyle, draggingStyle, droppableId, capacity, } = options;
    const animatedViewRef = useAnimatedRef();
    const id = useRef(_getUniqueDroppableId()).current;
    const stringId = useRef(droppableId || `droppable-${id}`).current;
    const instanceId = useRef(`droppable-${id}-${Math.random().toString(36).substr(2, 9)}`).current;
    const { register, unregister, isRegistered, activeHoverSlotId: contextActiveHoverSlotId, isDragging, registerPositionUpdateListener, unregisterPositionUpdateListener, } = useContext(SlotsContext);
    const isActive = contextActiveHoverSlotId === id;
    const { processedActiveStyle, activeTransforms } = useMemo(() => {
        if (!isActive || !activeStyle) {
            return { processedActiveStyle: null, activeTransforms: [] };
        }
        const flattenedStyle = StyleSheet.flatten(activeStyle);
        let processedStyle = { ...flattenedStyle };
        let transforms = [];
        if (flattenedStyle.transform) {
            if (Array.isArray(flattenedStyle.transform)) {
                transforms = [...flattenedStyle.transform];
            }
            delete processedStyle.transform;
        }
        return {
            processedActiveStyle: processedStyle,
            activeTransforms: transforms,
        };
    }, [isActive, activeStyle]);
    const { processedDraggingStyle, draggingTransforms } = useMemo(() => {
        if (!isDragging || !draggingStyle) {
            return { processedDraggingStyle: null, draggingTransforms: [] };
        }
        const flattenedStyle = StyleSheet.flatten(draggingStyle);
        let processedStyle = { ...flattenedStyle };
        let transforms = [];
        if (flattenedStyle.transform) {
            if (Array.isArray(flattenedStyle.transform)) {
                transforms = [...flattenedStyle.transform];
            }
            delete processedStyle.transform;
        }
        return {
            processedDraggingStyle: processedStyle,
            draggingTransforms: transforms,
        };
    }, [isDragging, draggingStyle]);
    const combinedActiveStyle = useMemo(() => {
        if ((!isActive || !activeStyle) && (!isDragging || !draggingStyle)) {
            return undefined;
        }
        let currentStyle = [];
        let currentTransforms = [];
        if (isDragging && draggingStyle) {
            currentStyle.push(processedDraggingStyle);
            currentTransforms = [...currentTransforms, ...draggingTransforms];
        }
        if (isActive && activeStyle) {
            currentStyle.push(processedActiveStyle);
            currentTransforms = [...currentTransforms, ...activeTransforms];
        }
        const aggregateStyle = StyleSheet.flatten(currentStyle);
        if (currentTransforms.length === 0) {
            return aggregateStyle;
        }
        return {
            ...aggregateStyle,
            transform: currentTransforms,
        };
    }, [
        isActive,
        activeStyle,
        processedActiveStyle,
        activeTransforms,
        isDragging,
        draggingStyle,
        processedDraggingStyle,
        draggingTransforms,
    ]);
    useEffect(() => {
        onActiveChange === null || onActiveChange === void 0 ? void 0 : onActiveChange(isActive);
    }, [isActive, onActiveChange]);
    const updateDroppablePosition = useCallback(() => {
        scheduleOnUI(() => {
            const measurement = measure(animatedViewRef);
            if (measurement === null) {
                return;
            }
            if (measurement.width > 0 && measurement.height > 0) {
                scheduleOnRN(register, id, {
                    id: droppableId || `droppable-${id}`,
                    x: measurement.pageX,
                    y: measurement.pageY,
                    width: measurement.width,
                    height: measurement.height,
                    onDrop,
                    dropAlignment: dropAlignment || "center",
                    dropOffset: dropOffset || { x: 0, y: 0 },
                    capacity,
                });
            }
        });
    }, [
        id,
        droppableId,
        onDrop,
        register,
        animatedViewRef,
        dropAlignment,
        dropOffset,
        capacity,
    ]);
    const handleLayoutHandler = useCallback((_event) => {
        updateDroppablePosition();
    }, [updateDroppablePosition]);
    useEffect(() => {
        registerPositionUpdateListener(instanceId, updateDroppablePosition);
        return () => {
            unregisterPositionUpdateListener(instanceId);
        };
    }, [
        instanceId,
        registerPositionUpdateListener,
        unregisterPositionUpdateListener,
        updateDroppablePosition,
    ]);
    useEffect(() => {
        if (dropDisabled) {
            unregister(id);
        }
        else {
            updateDroppablePosition();
        }
    }, [
        dropDisabled,
        id,
        unregister,
        updateDroppablePosition,
    ]);
    useEffect(() => {
        return () => {
            unregister(id);
        };
    }, [id, unregister]);
    return {
        viewProps: {
            onLayout: handleLayoutHandler,
            style: combinedActiveStyle,
        },
        isActive,
        isDragging,
        activeStyle,
        animatedViewRef,
    };
};
