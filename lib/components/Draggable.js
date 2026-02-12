import React, { createContext, useContext } from "react";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useDraggable } from "../hooks/useDraggable";
const DraggableContext = createContext(null);
const Handle = ({ children, style }) => {
    const draggableContext = useContext(DraggableContext);
    if (!draggableContext) {
        console.warn("Draggable.Handle must be used within a Draggable component");
        return React.createElement(React.Fragment, null, children);
    }
    return (React.createElement(GestureDetector, { gesture: draggableContext.gesture },
        React.createElement(Animated.View, { style: style }, children)));
};
const DraggableComponent = ({ style: componentStyle, children, ...useDraggableHookOptions }) => {
    const { animatedViewProps, gesture, state, hasHandle, animatedViewRef } = useDraggable({
        ...useDraggableHookOptions,
        children,
        handleComponent: Handle,
    });
    const contextValue = {
        gesture,
        state,
    };
    const content = (React.createElement(Animated.View, { ref: animatedViewRef, ...animatedViewProps, style: [componentStyle, animatedViewProps.style], collapsable: false },
        React.createElement(DraggableContext.Provider, { value: contextValue }, children)));
    if (hasHandle) {
        return content;
    }
    else {
        return React.createElement(GestureDetector, { gesture: gesture }, content);
    }
};
export const Draggable = Object.assign(DraggableComponent, { Handle });
