import { DropProviderRef } from "../types/context";
export interface UseSortableListOptions<TData> {
    data: TData[];
    itemHeight: number;
    itemKeyExtractor?: (item: TData, index: number) => string;
}
export interface UseSortableListReturn<TData> {
    positions: any;
    scrollY: any;
    autoScroll: any;
    scrollViewRef: any;
    dropProviderRef: React.RefObject<DropProviderRef>;
    handleScroll: any;
    handleScrollEnd: () => void;
    contentHeight: number;
    getItemProps: (item: TData, index: number) => {
        id: string;
        positions: any;
        lowerBound: any;
        autoScrollDirection: any;
        itemsCount: number;
        itemHeight: number;
    };
}
export declare function useSortableList<TData extends {
    id: string;
}>(options: UseSortableListOptions<TData>): UseSortableListReturn<TData>;
