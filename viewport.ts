export class Viewport {
    screenStart: { x: number; y: number };
    vWidth: number;
    vHeight: number;
    xOffset: number;
    yOffset: number;

    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    ctx: CanvasRenderingContext2D;

    constructor(
        vWidth: number,
        vHeight: number,
        screenStartX: number,
        screenStartY: number,
        ctx: CanvasRenderingContext2D
    ) {
        this.screenStart = { x: screenStartX, y: screenStartY }; // Where on the screen the upper left pixel lies
        // (used for offsetting when calculating the coordinate out of the pixel position on the screen)
        this.vWidth = vWidth;
        this.vHeight = vHeight;
        this.xOffset = 0;
        this.yOffset = 0;
        this.yMin = -2.0; //+ this.yOffset;
        this.yMax = 2.0; //+ this.yOffset;
        this.xMin = -2.0; //+ this.xOffset;
        // The third value is calculated based on the aspect ratio of the screen
        this.xMax = (vWidth / vHeight) * (this.yMax - this.yMin) + this.xMin;
    }

    updateXYBounds(yMin: number, yMax: number, xMin: number) {
        this.yMin = yMin;
        this.yMax = yMax;
        this.xMin = xMin;
        this.xMax = (this.vWidth / this.vHeight) * (this.yMax - this.yMin) + this.xMin;
    }

    xToCoord(x: number) {
        return ((x - this.screenStart.x) * (this.xMax - this.xMin)) / this.vWidth + this.xMin;
    }
    yToCoord(y: number) {
        return ((y - this.screenStart.y) / this.vHeight) * (this.yMin - this.yMax) + this.yMax; // Flip so that the y-axis grows towards the top
    }
    coordToX(x: number) {
        return ((x - this.xMin) / (this.xMax - this.xMin)) * this.vWidth + this.screenStart.x;
    }
    coordToY(y: number) {
        return ((y - this.yMax) / (this.yMin - this.yMax)) * this.vHeight + this.screenStart.y;
    }
}
