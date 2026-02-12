import React from 'react';
import { SharedValue } from 'react-native-reanimated';
export interface IDragOverlayProps<TData = any> {
    activeDraggableId: string | null;
    activeDraggableData: TData | null;
    position: {
        x: number;
        y: number;
    };
    positionX?: SharedValue<number>;
    positionY?: SharedValue<number>;
    children: (data: TData, draggableProps: IInternalDraggableState) => React.ReactNode;
    onDragEnd: () => void;
    style?: any;
}
export interface IInternalDraggableState {
    isDragging: boolean;
    position: {
        x: number;
        y: number;
    };
    scale: number;
    opacity: number;
}
export declare const DragOverlay: <TData = any>({ activeDraggableId, activeDraggableData, position, positionX, positionY, children, onDragEnd, style, }: IDragOverlayProps<TData>) => React.JSX.Element;
