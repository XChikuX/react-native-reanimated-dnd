import { useRef, useCallback } from "react";
import { scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useSharedValue, } from "react-native-reanimated";
import { listToObject } from "../components/sortableUtils";
import { ScrollDirection } from "../types/sortable";
export function useSortableList(options) {
    const { data, itemHeight, itemKeyExtractor = (item) => item.id } = options;
    if (__DEV__) {
        data.forEach((item, index) => {
            const id = itemKeyExtractor(item, index);
            if (typeof id !== "string" || !id) {
                console.error(`[react-native-reanimated-dnd] Item at index ${index} has invalid id: ${id}. ` +
                    `Each item must have a unique string id property.`);
            }
        });
    }
    const positions = useSharedValue(listToObject(data));
    const scrollY = useSharedValue(0);
    const autoScroll = useSharedValue(ScrollDirection.None);
    const scrollViewRef = useAnimatedRef();
    const dropProviderRef = useRef(null);
    useAnimatedReaction(() => scrollY.value, (scrolling) => {
        scrollTo(scrollViewRef, 0, scrolling, false);
    });
    const handleScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });
    const handleScrollEnd = useCallback(() => {
        let localScrollTimeout = null;
        if (localScrollTimeout) {
            clearTimeout(localScrollTimeout);
        }
        localScrollTimeout = setTimeout(() => {
            var _a;
            (_a = dropProviderRef.current) === null || _a === void 0 ? void 0 : _a.requestPositionUpdate();
        }, 50);
    }, []);
    const contentHeight = data.length * itemHeight;
    const getItemProps = useCallback((item, index) => {
        const id = itemKeyExtractor(item, index);
        return {
            id,
            positions,
            lowerBound: scrollY,
            autoScrollDirection: autoScroll,
            itemsCount: data.length,
            itemHeight,
        };
    }, [data.length, itemHeight, itemKeyExtractor, positions, scrollY, autoScroll]);
    return {
        positions,
        scrollY,
        autoScroll,
        scrollViewRef,
        dropProviderRef,
        handleScroll,
        handleScrollEnd,
        contentHeight,
        getItemProps,
    };
}
