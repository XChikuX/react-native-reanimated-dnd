import React, { createContext, useCallback, useContext, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { DragOverlay } from '../components/DragOverlay';
const DragOverlayContext = createContext(undefined);
export const useDragOverlay = () => {
    const context = useContext(DragOverlayContext);
    if (!context) {
        throw new Error('useDragOverlay must be used within a DragOverlayProvider');
    }
    return context;
};
export const DragOverlayProvider = ({ children, renderDragOverlay, }) => {
    const [activeDraggableId, setActiveDraggableId] = useState(null);
    const [activeDraggableData, setActiveDraggableData] = useState(null);
    const positionX = useSharedValue(0);
    const positionY = useSharedValue(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const showDragOverlay = useCallback((draggableId, data, initialPosition) => {
        positionX.value = initialPosition.x;
        positionY.value = initialPosition.y;
        setActiveDraggableId(draggableId);
        setActiveDraggableData(data);
        setPosition(initialPosition);
    }, [positionX, positionY]);
    const hideDragOverlay = useCallback(() => {
        setActiveDraggableId(null);
        setActiveDraggableData(null);
    }, []);
    const updateDragOverlayPosition = useCallback((newPosition) => {
        positionX.value = newPosition.x;
        positionY.value = newPosition.y;
        setPosition(newPosition);
    }, [positionX, positionY]);
    const getActiveDraggableId = useCallback(() => {
        return activeDraggableId;
    }, [activeDraggableId]);
    const contextValue = {
        showDragOverlay,
        hideDragOverlay,
        updateDragOverlayPosition,
        getActiveDraggableId,
    };
    const defaultRenderDragOverlay = useCallback((data, draggableState) => {
        return null;
    }, []);
    const dragOverlayRenderFunction = renderDragOverlay || defaultRenderDragOverlay;
    return (React.createElement(DragOverlayContext.Provider, { value: contextValue },
        children,
        React.createElement(DragOverlay, { activeDraggableId: activeDraggableId, activeDraggableData: activeDraggableData, position: position, positionX: positionX, positionY: positionY, onDragEnd: hideDragOverlay }, dragOverlayRenderFunction)));
};
