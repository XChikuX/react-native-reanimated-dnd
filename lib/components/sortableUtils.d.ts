import { SharedValue } from "react-native-reanimated";
export declare enum ScrollDirection {
    None = "none",
    Up = "up",
    Down = "down"
}
export declare enum HorizontalScrollDirection {
    None = "none",
    Left = "left",
    Right = "right"
}
export declare function clamp(value: number, lowerBound: number, upperBound: number): number;
export declare function objectMove(object: {
    [id: string]: number;
}, from: number, to: number): {
    [id: string]: number;
};
export declare function listToObject<T extends {
    id: string;
}>(list: T[]): {
    [id: string]: number;
};
export declare function setPosition(positionY: number, itemsCount: number, positions: SharedValue<{
    [id: string]: number;
}>, id: string, itemHeight: number): void;
export declare function setAutoScroll(positionY: number, lowerBound: number, upperBound: number, scrollThreshold: number, autoScroll: SharedValue<ScrollDirection>): void;
export declare function getItemXPosition(position: number, itemWidth: number, gap?: number, paddingHorizontal?: number): number;
export declare function getContentWidth(itemsCount: number, itemWidth: number, gap?: number, paddingHorizontal?: number): number;
export declare function setHorizontalPosition(positionX: number, itemsCount: number, positions: SharedValue<{
    [id: string]: number;
}>, id: string, itemWidth: number, gap?: number, paddingHorizontal?: number): void;
export declare function setHorizontalAutoScroll(positionX: number, leftBound: number, rightBound: number, scrollThreshold: number, autoScrollDirection: SharedValue<HorizontalScrollDirection>): void;
export declare const dataHash: (data: any[]) => string;
