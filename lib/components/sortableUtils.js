export var ScrollDirection;
(function (ScrollDirection) {
    ScrollDirection["None"] = "none";
    ScrollDirection["Up"] = "up";
    ScrollDirection["Down"] = "down";
})(ScrollDirection || (ScrollDirection = {}));
export var HorizontalScrollDirection;
(function (HorizontalScrollDirection) {
    HorizontalScrollDirection["None"] = "none";
    HorizontalScrollDirection["Left"] = "left";
    HorizontalScrollDirection["Right"] = "right";
})(HorizontalScrollDirection || (HorizontalScrollDirection = {}));
export function clamp(value, lowerBound, upperBound) {
    "worklet";
    return Math.max(lowerBound, Math.min(value, upperBound));
}
export function objectMove(object, from, to) {
    "worklet";
    const newObject = Object.assign({}, object);
    for (const id in object) {
        if (object[id] === from) {
            newObject[id] = to;
        }
        if (object[id] === to) {
            newObject[id] = from;
        }
    }
    return newObject;
}
export function listToObject(list) {
    const values = Object.values(list);
    const object = {};
    for (let i = 0; i < values.length; i++) {
        object[values[i].id] = i;
    }
    return object;
}
export function setPosition(positionY, itemsCount, positions, id, itemHeight) {
    "worklet";
    const newPosition = clamp(Math.floor(positionY / itemHeight), 0, itemsCount - 1);
    if (newPosition !== positions.value[id]) {
        positions.value = objectMove(positions.value, positions.value[id], newPosition);
    }
}
export function setAutoScroll(positionY, lowerBound, upperBound, scrollThreshold, autoScroll) {
    "worklet";
    if (positionY <= lowerBound + scrollThreshold) {
        autoScroll.value = ScrollDirection.Up;
    }
    else if (positionY >= upperBound - scrollThreshold) {
        autoScroll.value = ScrollDirection.Down;
    }
    else {
        autoScroll.value = ScrollDirection.None;
    }
}
export function getItemXPosition(position, itemWidth, gap = 0, paddingHorizontal = 0) {
    "worklet";
    return paddingHorizontal + position * (itemWidth + gap);
}
export function getContentWidth(itemsCount, itemWidth, gap = 0, paddingHorizontal = 0) {
    "worklet";
    if (itemsCount === 0)
        return paddingHorizontal * 2;
    const totalItemsWidth = itemsCount * itemWidth;
    const totalGaps = Math.max(0, itemsCount - 1) * gap;
    return totalItemsWidth + totalGaps + paddingHorizontal * 2;
}
export function setHorizontalPosition(positionX, itemsCount, positions, id, itemWidth, gap = 0, paddingHorizontal = 0) {
    "worklet";
    const adjustedX = positionX - paddingHorizontal;
    const itemWithGapWidth = itemWidth + gap;
    const newPosition = clamp(Math.floor(adjustedX / itemWithGapWidth), 0, itemsCount - 1);
    if (newPosition !== positions.value[id]) {
        positions.value = objectMove(positions.value, positions.value[id], newPosition);
    }
}
export function setHorizontalAutoScroll(positionX, leftBound, rightBound, scrollThreshold, autoScrollDirection) {
    "worklet";
    const effectiveThreshold = Math.max(scrollThreshold, 60);
    const leftEdge = leftBound + effectiveThreshold;
    const rightEdge = rightBound - effectiveThreshold;
    if (positionX < leftEdge) {
        autoScrollDirection.value = HorizontalScrollDirection.Left;
    }
    else if (positionX > rightEdge) {
        autoScrollDirection.value = HorizontalScrollDirection.Right;
    }
    else {
        autoScrollDirection.value = HorizontalScrollDirection.None;
    }
}
export const dataHash = (data) => {
    const str = data.reduce((acc, item) => acc + item.id, "");
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    return hash.toString();
};
