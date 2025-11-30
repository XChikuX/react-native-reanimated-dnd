import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { DragOverlay } from '../components/DragOverlay';

export interface IDragOverlayContextType<TData = any> {
  /**
   * Show the drag overlay with the specified item
   */
  showDragOverlay: (draggableId: string, data: TData, position: { x: number; y: number }) => void;
  
  /**
   * Hide the drag overlay
   */
  hideDragOverlay: () => void;
  
  /**
   * Update the position of the drag overlay
   */
  updateDragOverlayPosition: (position: { x: number; y: number }) => void;
  
  /**
   * Get the current active draggable ID
   */
  getActiveDraggableId: () => string | null;
}

const DragOverlayContext = createContext<IDragOverlayContextType | undefined>(undefined);

export const useDragOverlay = <TData = any>(): IDragOverlayContextType<TData> => {
  const context = useContext(DragOverlayContext);
  if (!context) {
    throw new Error('useDragOverlay must be used within a DragOverlayProvider');
  }
  return context as IDragOverlayContextType<TData>;
};

export interface IDragOverlayProviderProps<TData = any> {
  children: ReactNode;
  
  /**
   * Custom render function for the drag overlay
   * If not provided, uses a default implementation
   */
  renderDragOverlay?: (data: TData, draggableState: any) => React.ReactNode;
}

export const DragOverlayProvider = <TData = any>({
  children,
  renderDragOverlay,
}: IDragOverlayProviderProps<TData>) => {
  const [activeDraggableId, setActiveDraggableId] = useState<string | null>(null);
  const [activeDraggableData, setActiveDraggableData] = useState<TData | null>(null);
  
  // Use shared values for position to enable smooth Reanimated animations
  const positionX = useSharedValue(0);
  const positionY = useSharedValue(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const showDragOverlay = useCallback((draggableId: string, data: TData, initialPosition: { x: number; y: number }) => {
    // Update shared values immediately (runs synchronously, no React state delay)
    positionX.value = initialPosition.x;
    positionY.value = initialPosition.y;
    // Update React state for component rendering
    setActiveDraggableId(draggableId);
    setActiveDraggableData(data);
    setPosition(initialPosition);
  }, [positionX, positionY]);

  const hideDragOverlay = useCallback(() => {
    setActiveDraggableId(null);
    setActiveDraggableData(null);
  }, []);

  const updateDragOverlayPosition = useCallback((newPosition: { x: number; y: number }) => {
    // Update shared values immediately (runs on UI thread, no React state delay)
    positionX.value = newPosition.x;
    positionY.value = newPosition.y;
    // Also update React state for initial render, but shared values are the source of truth
    setPosition(newPosition);
  }, [positionX, positionY]);

  const getActiveDraggableId = useCallback(() => {
    return activeDraggableId;
  }, [activeDraggableId]);

  const contextValue: IDragOverlayContextType<TData> = {
    showDragOverlay,
    hideDragOverlay,
    updateDragOverlayPosition,
    getActiveDraggableId,
  };

  // Default render function if none provided
  const defaultRenderDragOverlay = useCallback((data: TData, draggableState: any) => {
    // This is a fallback - in practice, the Draggable component should provide its own render function
    return null;
  }, []);

  const dragOverlayRenderFunction = renderDragOverlay || defaultRenderDragOverlay;

  return (
    <DragOverlayContext.Provider value={contextValue}>
      {children}
      <DragOverlay
        activeDraggableId={activeDraggableId}
        activeDraggableData={activeDraggableData}
        position={position}
        positionX={positionX}
        positionY={positionY}
        onDragEnd={hideDragOverlay}
      >
        {dragOverlayRenderFunction}
      </DragOverlay>
    </DragOverlayContext.Provider>
  );
};
