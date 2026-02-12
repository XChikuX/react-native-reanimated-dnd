import React, { createContext, useContext } from "react";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useHorizontalSortable } from "../hooks/useHorizontalSortable";
import { useSortable } from "../hooks/useSortable";
import { SortableDirection, } from "../types/sortable";
const SortableContext = createContext(null);
const SortableHandle = ({ children, style }) => {
    const sortableContext = useContext(SortableContext);
    if (!sortableContext) {
        console.warn("SortableHandle must be used within a SortableItem component");
        return React.createElement(React.Fragment, null, children);
    }
    return (React.createElement(GestureDetector, { gesture: sortableContext.panGestureHandler },
        React.createElement(Animated.View, { style: style }, children)));
};
export function SortableItem({ id, data, positions, direction = SortableDirection.Vertical, lowerBound, leftBound, autoScrollDirection, autoScrollHorizontalDirection, itemsCount, itemHeight, itemWidth, gap = 0, paddingHorizontal = 0, containerHeight, containerWidth, children, style, animatedStyle: customAnimatedStyle, onMove, onDragStart, onDrop, onDragging, onDraggingHorizontal, }) {
    if (direction === SortableDirection.Vertical &&
        (!itemHeight || !lowerBound || !autoScrollDirection)) {
        throw new Error("itemHeight, lowerBound, and autoScrollDirection are required for vertical direction");
    }
    if (direction === SortableDirection.Horizontal &&
        (!itemWidth || !leftBound || !autoScrollHorizontalDirection)) {
        throw new Error("itemWidth, leftBound, and autoScrollHorizontalDirection are required for horizontal direction");
    }
    if (direction === SortableDirection.Horizontal) {
        const horizontalOptions = {
            id,
            positions,
            leftBound: leftBound,
            autoScrollDirection: autoScrollHorizontalDirection,
            itemsCount,
            itemWidth: itemWidth,
            gap,
            paddingHorizontal,
            containerWidth,
            onMove,
            onDragStart,
            onDrop,
            onDragging: onDraggingHorizontal,
            children,
            handleComponent: SortableHandle,
        };
        const { animatedStyle: horizontalAnimatedStyle, panGestureHandler: horizontalPanGestureHandler, isMoving: horizontalIsMoving, hasHandle: horizontalHasHandle, } = useHorizontalSortable(horizontalOptions);
        const combinedAnimatedStyle = [
            horizontalAnimatedStyle,
            customAnimatedStyle,
        ];
        const contextValue = {
            panGestureHandler: horizontalPanGestureHandler,
        };
        const content = (React.createElement(Animated.View, { style: combinedAnimatedStyle },
            React.createElement(SortableContext.Provider, { value: contextValue },
                React.createElement(Animated.View, { style: style }, children))));
        if (horizontalHasHandle) {
            return content;
        }
        else {
            return (React.createElement(GestureDetector, { gesture: horizontalPanGestureHandler }, content));
        }
    }
    const verticalOptions = {
        id,
        positions,
        lowerBound: lowerBound,
        autoScrollDirection: autoScrollDirection,
        itemsCount,
        itemHeight: itemHeight,
        containerHeight,
        onMove,
        onDragStart,
        onDrop,
        onDragging,
        children,
        handleComponent: SortableHandle,
    };
    const { animatedStyle: verticalAnimatedStyle, panGestureHandler: verticalPanGestureHandler, isMoving: verticalIsMoving, hasHandle: verticalHasHandle, } = useSortable(verticalOptions);
    const combinedAnimatedStyle = [verticalAnimatedStyle, customAnimatedStyle];
    const contextValue = {
        panGestureHandler: verticalPanGestureHandler,
    };
    const content = (React.createElement(Animated.View, { style: combinedAnimatedStyle },
        React.createElement(SortableContext.Provider, { value: contextValue },
            React.createElement(Animated.View, { style: style }, children))));
    if (verticalHasHandle) {
        return content;
    }
    else {
        return (React.createElement(GestureDetector, { gesture: verticalPanGestureHandler }, content));
    }
}
SortableItem.Handle = SortableHandle;
