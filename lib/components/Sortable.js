import React, { memo, useCallback } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { GestureHandlerRootView, FlatList, ScrollView, } from "react-native-gesture-handler";
import { DropProvider } from "../context/DropContext";
import { SortableDirection, } from "../types/sortable";
import { useSortableList, } from "../hooks/useSortableList";
import { useHorizontalSortableList } from "../hooks/useHorizontalSortableList";
import { dataHash } from "./sortableUtils";
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
function SortableComponent({ data, renderItem, direction = SortableDirection.Vertical, itemHeight, itemWidth, gap = 0, paddingHorizontal = 0, style, contentContainerStyle, itemKeyExtractor = (item) => item.id, useFlatList = true, }) {
    if (direction === SortableDirection.Vertical && !itemHeight) {
        throw new Error("itemHeight is required when direction is vertical");
    }
    if (direction === SortableDirection.Horizontal && !itemWidth) {
        throw new Error("itemWidth is required when direction is horizontal");
    }
    if (direction === SortableDirection.Horizontal) {
        const horizontalOptions = {
            data,
            itemWidth: itemWidth,
            gap,
            paddingHorizontal,
            itemKeyExtractor,
        };
        const { scrollViewRef: horizontalScrollViewRef, dropProviderRef: horizontalDropProviderRef, handleScroll: horizontalHandleScroll, handleScrollEnd: horizontalHandleScrollEnd, contentWidth, getItemProps: getHorizontalItemProps, } = useHorizontalSortableList(horizontalOptions);
        const memoizedHorizontalRenderItem = useCallback(({ item, index }) => {
            const itemProps = getHorizontalItemProps(item, index);
            const sortableItemProps = {
                item: item,
                index,
                direction: SortableDirection.Horizontal,
                autoScrollHorizontalDirection: itemProps.autoScrollDirection,
                ...itemProps,
            };
            return renderItem(sortableItemProps);
        }, [getHorizontalItemProps, renderItem]);
        return (React.createElement(GestureHandlerRootView, { style: styles.flex },
            React.createElement(DropProvider, { ref: horizontalDropProviderRef }, useFlatList ? (React.createElement(AnimatedFlatList, { ref: horizontalScrollViewRef, data: data, keyExtractor: itemKeyExtractor, horizontal: true, renderItem: memoizedHorizontalRenderItem, onScroll: horizontalHandleScroll, scrollEventThrottle: 16, style: [styles.scrollView, style], contentContainerStyle: [
                    { width: contentWidth },
                    contentContainerStyle,
                ], onScrollEndDrag: horizontalHandleScrollEnd, onMomentumScrollEnd: horizontalHandleScrollEnd, simultaneousHandlers: horizontalDropProviderRef, showsHorizontalScrollIndicator: false })) : (React.createElement(AnimatedScrollView, { ref: horizontalScrollViewRef, onScroll: horizontalHandleScroll, scrollEventThrottle: 16, horizontal: true, style: [styles.scrollView, style], contentContainerStyle: [
                    { width: contentWidth },
                    contentContainerStyle,
                ], onScrollEndDrag: horizontalHandleScrollEnd, onMomentumScrollEnd: horizontalHandleScrollEnd, simultaneousHandlers: horizontalDropProviderRef, showsHorizontalScrollIndicator: false }, data.map((item, index) => {
                const itemProps = getHorizontalItemProps(item, index);
                const sortableItemProps = {
                    item,
                    index,
                    direction: SortableDirection.Horizontal,
                    autoScrollHorizontalDirection: itemProps.autoScrollDirection,
                    ...itemProps,
                };
                return renderItem(sortableItemProps);
            }))))));
    }
    const verticalOptions = {
        data,
        itemHeight: itemHeight,
        itemKeyExtractor,
    };
    const { scrollViewRef, dropProviderRef, handleScroll, handleScrollEnd, contentHeight, getItemProps, } = useSortableList(verticalOptions);
    const memoizedVerticalRenderItem = useCallback(({ item, index }) => {
        const itemProps = getItemProps(item, index);
        const sortableItemProps = {
            item: item,
            index,
            direction: SortableDirection.Vertical,
            ...itemProps,
        };
        return renderItem(sortableItemProps);
    }, [getItemProps, renderItem]);
    return (React.createElement(GestureHandlerRootView, { style: styles.flex },
        React.createElement(DropProvider, { ref: dropProviderRef }, useFlatList ? (React.createElement(AnimatedFlatList, { ref: scrollViewRef, data: data, keyExtractor: itemKeyExtractor, renderItem: memoizedVerticalRenderItem, onScroll: handleScroll, scrollEventThrottle: 16, style: [styles.scrollView, style], contentContainerStyle: [
                { height: contentHeight },
                contentContainerStyle,
            ], onScrollEndDrag: handleScrollEnd, onMomentumScrollEnd: handleScrollEnd, simultaneousHandlers: dropProviderRef, showsVerticalScrollIndicator: false })) : (React.createElement(AnimatedScrollView, { ref: scrollViewRef, onScroll: handleScroll, scrollEventThrottle: 16, style: [styles.scrollView, style], contentContainerStyle: [
                { height: contentHeight },
                contentContainerStyle,
            ], onScrollEndDrag: handleScrollEnd, onMomentumScrollEnd: handleScrollEnd, simultaneousHandlers: dropProviderRef }, data.map((item, index) => {
            const itemProps = getItemProps(item, index);
            const sortableItemProps = {
                item,
                index,
                direction: SortableDirection.Vertical,
                ...itemProps,
            };
            return renderItem(sortableItemProps);
        }))))));
}
export const Sortable = memo(({ data, renderItem, ...props }) => {
    const dataHashKey = dataHash(data);
    return (React.createElement(SortableComponent, { data: data, renderItem: renderItem, ...props, key: dataHashKey }));
});
const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        position: "relative",
        backgroundColor: "white",
    },
});
