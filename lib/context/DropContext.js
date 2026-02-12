import React, { useRef, useState, useMemo, useCallback, forwardRef, useImperativeHandle, useEffect, } from "react";
import { SlotsContext, } from "../types/context";
export const DropProvider = forwardRef(({ children, onLayoutUpdateComplete, onDroppedItemsUpdate, onDragging, onDragStart, onDragEnd, }, ref) => {
    const slotsRef = useRef({});
    const [activeHoverSlotId, setActiveHoverSlotIdState] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [droppedItems, setDroppedItems] = useState({});
    const positionUpdateListenersRef = useRef({});
    const registerPositionUpdateListener = useCallback((id, listener) => {
        positionUpdateListenersRef.current[id] = listener;
    }, []);
    const unregisterPositionUpdateListener = useCallback((id) => {
        delete positionUpdateListenersRef.current[id];
    }, []);
    useEffect(() => {
        if (onDroppedItemsUpdate) {
            onDroppedItemsUpdate(droppedItems);
        }
    }, [droppedItems, onDroppedItemsUpdate]);
    const registerDroppedItem = useCallback((draggableId, droppableId, itemData) => {
        setDroppedItems((prev) => ({
            ...prev,
            [draggableId]: {
                droppableId,
                data: itemData,
            },
        }));
    }, []);
    const unregisterDroppedItem = useCallback((draggableId) => {
        setDroppedItems((prev) => {
            const newItems = { ...prev };
            delete newItems[draggableId];
            return newItems;
        });
    }, []);
    const getDroppedItems = useCallback(() => {
        return droppedItems;
    }, [droppedItems]);
    const internalRequestPositionUpdate = useCallback(() => {
        const listeners = positionUpdateListenersRef.current;
        Object.values(listeners).forEach((listener) => {
            listener();
        });
        onLayoutUpdateComplete === null || onLayoutUpdateComplete === void 0 ? void 0 : onLayoutUpdateComplete();
    }, [onLayoutUpdateComplete]);
    useImperativeHandle(ref, () => ({
        requestPositionUpdate: internalRequestPositionUpdate,
        getDroppedItems,
    }));
    const hasAvailableCapacity = useCallback((droppableId) => {
        const droppedCount = Object.values(droppedItems).filter((item) => item.droppableId === droppableId).length;
        const droppableSlot = Object.values(slotsRef.current).find((slot) => slot.id === droppableId);
        if (!droppableSlot)
            return false;
        const capacity = droppableSlot.capacity !== undefined ? droppableSlot.capacity : 1;
        return droppedCount < capacity;
    }, [droppedItems]);
    const handleDragStart = useCallback((data) => {
        setIsDragging(true);
        if (onDragStart) {
            onDragStart(data);
        }
        internalRequestPositionUpdate();
    }, [onDragStart, internalRequestPositionUpdate, setIsDragging]);
    const handleDragEnd = useCallback((data) => {
        setIsDragging(false);
        if (onDragEnd) {
            onDragEnd(data);
        }
        internalRequestPositionUpdate();
    }, [onDragEnd, internalRequestPositionUpdate, setIsDragging]);
    const contextValue = useMemo(() => ({
        register: (id, slot) => {
            slotsRef.current[id] = slot;
        },
        unregister: (id) => {
            delete slotsRef.current[id];
        },
        isRegistered: (id) => {
            return slotsRef.current[id] !== undefined;
        },
        getSlots: () => slotsRef.current,
        setActiveHoverSlot: (id) => setActiveHoverSlotIdState(id),
        activeHoverSlotId,
        registerPositionUpdateListener,
        unregisterPositionUpdateListener,
        requestPositionUpdate: internalRequestPositionUpdate,
        registerDroppedItem,
        unregisterDroppedItem,
        getDroppedItems,
        hasAvailableCapacity,
        isDragging,
        onDragging,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
    }), [
        activeHoverSlotId,
        registerPositionUpdateListener,
        unregisterPositionUpdateListener,
        internalRequestPositionUpdate,
        registerDroppedItem,
        unregisterDroppedItem,
        getDroppedItems,
        hasAvailableCapacity,
        isDragging,
        onDragging,
        handleDragStart,
        onDragEnd,
        handleDragEnd,
    ]);
    return (React.createElement(SlotsContext.Provider, { value: contextValue }, children));
});
DropProvider.displayName = "DropProvider";
