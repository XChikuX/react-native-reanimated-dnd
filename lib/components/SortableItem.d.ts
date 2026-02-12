import React from "react";
import { SortableHandleProps, SortableItemProps } from "../types/sortable";
export declare function SortableItem<T>({ id, data, positions, direction, lowerBound, leftBound, autoScrollDirection, autoScrollHorizontalDirection, itemsCount, itemHeight, itemWidth, gap, paddingHorizontal, containerHeight, containerWidth, children, style, animatedStyle: customAnimatedStyle, onMove, onDragStart, onDrop, onDragging, onDraggingHorizontal, }: SortableItemProps<T>): React.JSX.Element;
export declare namespace SortableItem {
    var Handle: ({ children, style }: SortableHandleProps) => React.JSX.Element;
}
