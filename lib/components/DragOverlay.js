import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
export const DragOverlay = ({ activeDraggableId, activeDraggableData, position, positionX, positionY, children, onDragEnd, style, }) => {
    const sharedX = positionX || useSharedValue(position.x);
    const sharedY = positionY || useSharedValue(position.y);
    const isVisible = useSharedValue(activeDraggableId ? 1 : 0);
    React.useLayoutEffect(() => {
        if (!positionX || !positionY) {
            sharedX.value = position.x;
            sharedY.value = position.y;
        }
    }, [position.x, position.y, sharedX, sharedY, positionX, positionY]);
    React.useLayoutEffect(() => {
        isVisible.value = activeDraggableId ? 1 : 0;
    }, [activeDraggableId, isVisible]);
    const animatedStyle = useAnimatedStyle(() => {
        'worklet';
        const visible = isVisible.value === 1;
        return {
            transform: [
                { translateX: sharedX.value },
                { translateY: sharedY.value },
                { scale: 1.15 },
            ],
            opacity: visible ? 1.0 : 0,
        };
    });
    const draggableState = {
        isDragging: !!activeDraggableId,
        position: position,
        scale: 1.15,
        opacity: activeDraggableId ? 1.0 : 0,
    };
    if (!activeDraggableId || !activeDraggableData) {
        return null;
    }
    return (React.createElement(Modal, { visible: true, transparent: true, animationType: "none", statusBarTranslucent: true, onRequestClose: () => { } },
        React.createElement(View, { style: styles.overlayContainer, pointerEvents: "box-none" },
            React.createElement(Animated.View, { style: [styles.dragItem, animatedStyle, style] }, children(activeDraggableData, draggableState)))));
};
const styles = StyleSheet.create({
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        pointerEvents: 'box-none',
        elevation: 999999,
        zIndex: 999999,
    },
    dragItem: {
        position: 'absolute',
        top: 0,
        left: 0,
        elevation: 999999,
        zIndex: 999999,
        backgroundColor: 'transparent',
    },
});
