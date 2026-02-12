import React, { ReactNode } from 'react';
export interface IDragOverlayContextType<TData = any> {
    showDragOverlay: (draggableId: string, data: TData, position: {
        x: number;
        y: number;
    }) => void;
    hideDragOverlay: () => void;
    updateDragOverlayPosition: (position: {
        x: number;
        y: number;
    }) => void;
    getActiveDraggableId: () => string | null;
}
export declare const useDragOverlay: <TData = any>() => IDragOverlayContextType<TData>;
export interface IDragOverlayProviderProps<TData = any> {
    children: ReactNode;
    renderDragOverlay?: (data: TData, draggableState: any) => React.ReactNode;
}
export declare const DragOverlayProvider: <TData = any>({ children, renderDragOverlay, }: IDragOverlayProviderProps<TData>) => React.JSX.Element;
