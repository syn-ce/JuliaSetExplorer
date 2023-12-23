export class Viewport {
    vWidth: number;
    vHeight: number;
    xOffset: number;
    yOffset: number;

    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    ctx: CanvasRenderingContext2D;

    constructor(vWidth: number, vHeight: number, ctx: CanvasRenderingContext2D) {
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

    xToCoord(x: number) {
        return (x * (this.xMax - this.xMin)) / this.vWidth + this.xMin;
    }
    yToCoord(y: number) {
        return (y / this.vHeight) * (this.yMin - this.yMax) + this.yMax; // Flip so that the y-axis grows towards the top
    }
}
