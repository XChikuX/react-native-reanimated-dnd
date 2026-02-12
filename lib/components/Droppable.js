import React from "react";
import Animated from "react-native-reanimated";
import { useDroppable } from "../hooks/useDroppable";
export const Droppable = ({ onDrop, dropDisabled, onActiveChange, dropAlignment, dropOffset, activeStyle, draggingStyle, droppableId, capacity, style, children, }) => {
    const { viewProps, animatedViewRef } = useDroppable({
        onDrop,
        dropDisabled,
        onActiveChange,
        dropAlignment,
        dropOffset,
        activeStyle,
        draggingStyle,
        droppableId,
        capacity,
    });
    return (React.createElement(Animated.View, { ref: animatedViewRef, ...viewProps, style: [style, viewProps.style], collapsable: false }, children));
};
