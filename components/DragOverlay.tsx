import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
    SharedValue,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

export interface IDragOverlayProps<TData = any> {
  /**
   * The ID of the currently dragging item, provided by the DropProvider context.
   * When null, the overlay is hidden.
   */
  activeDraggableId: string | null;
  
  /**
   * The data of the currently dragging item
   */
  activeDraggableData: TData | null;
  
  /**
   * Current position of the dragged item (for initial render)
   */
  position: { x: number; y: number };
  
  /**
   * Shared value for X position (updates immediately on UI thread)
   */
  positionX?: SharedValue<number>;
  
  /**
   * Shared value for Y position (updates immediately on UI thread)
   */
  positionY?: SharedValue<number>;
  
  /**
   * A render prop to allow users to customize the clone's appearance
   * (e.g., adding shadows or scale effects) without affecting the original item.
   */
  children: (data: TData, draggableProps: IInternalDraggableState) => React.ReactNode;
  
  /**
   * Called when the drag gesture ends
   */
  onDragEnd: () => void;
  
  /**
   * Optional style for the overlay container
   */
  style?: any;
}

export interface IInternalDraggableState {
  /**
   * Whether the item is currently being dragged
   */
  isDragging: boolean;
  
  /**
   * Current position offset
   */
  position: { x: number; y: number };
  
  /**
   * Scale factor for visual feedback
   */
  scale: number;
  
  /**
   * Opacity for visual feedback
   */
  opacity: number;
}

/**
 * DragOverlay component that renders a dragged item clone at the root level
 * using React Native's Modal to ensure it appears above all other content.
 * 
 * This component automatically handles the high z-index and positioning
 * to solve Kanban-style overlapping issues.
 */
export const DragOverlay = <TData = any>({
  activeDraggableId,
  activeDraggableData,
  position,
  positionX,
  positionY,
  children,
  onDragEnd,
  style,
}: IDragOverlayProps<TData>) => {
  // Use shared values directly from context if provided (no React state delay)
  // Otherwise fall back to local shared values synced from position prop
  const sharedX = positionX || useSharedValue(position.x);
  const sharedY = positionY || useSharedValue(position.y);
  const isVisible = useSharedValue(activeDraggableId ? 1 : 0);

  // Only sync from position prop if shared values weren't provided from context
  React.useLayoutEffect(() => {
    if (!positionX || !positionY) {
      sharedX.value = position.x;
      sharedY.value = position.y;
    }
  }, [position.x, position.y, sharedX, sharedY, positionX, positionY]);

  // Update visibility immediately
  React.useLayoutEffect(() => {
    isVisible.value = activeDraggableId ? 1 : 0;
  }, [activeDraggableId, isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    const visible = isVisible.value === 1;
    
    return {
      // Use transform with shared values for better performance and hardware acceleration
      // These update immediately on UI thread when positionX/positionY change
      transform: [
        { translateX: sharedX.value },
        { translateY: sharedY.value },
        { scale: 1.15 }, // Larger scale for better visibility
      ],
      opacity: visible ? 1.0 : 0, // Control visibility with opacity for instant updates
      // Hide completely when not visible to avoid touch interference
      pointerEvents: visible ? 'auto' : 'none',
    };
  });

  const draggableState: IInternalDraggableState = {
    isDragging: !!activeDraggableId,
    position: position,
    scale: 1.15,
    opacity: activeDraggableId ? 1.0 : 0,
  };

  // Only render Modal when there's an active draggable to avoid blocking the app
  // The shared values ensure position updates are immediate even with mount/unmount
  if (!activeDraggableId || !activeDraggableData) {
    return null;
  }

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.overlayContainer} pointerEvents="box-none">
        <Animated.View style={[styles.dragItem, animatedStyle, style]}>
          {children(activeDraggableData, draggableState)}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
    // Ensure it's above everything
    elevation: 999999,
    zIndex: 999999,
  },
  dragItem: {
    // Use absolute positioning with fixed layout
    position: 'absolute',
    top: 0,
    left: 0,
    // NO shadows, NO effects - fully opaque solid card
    elevation: 999999,
    zIndex: 999999,
    backgroundColor: 'transparent',
  },
});