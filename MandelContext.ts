import { FractalContext } from './FractalContext.js';
import { Viewport } from './viewport.js';

export class MandelContext extends FractalContext {
    juliaCenterIndicatorWrapper: HTMLElement;
    juliaCenterIndicator: HTMLElement;
    juliaCenterIndicatorDimensions: { x: number; y: number };
    currentIndicatorPos: { x: number; y: number }; // Used for adjusting when zooming
    indicatorFollowsMouse: boolean;

    constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        screenStart: { x: number; y: number },
        fragmentShaderText: string
    ) {
        super(canvas, width, height, screenStart, fragmentShaderText);

        this.addCenterIndicator();
        this.currentIndicatorPos = { x: 0.0, y: 0.0 };
        this.indicatorFollowsMouse = true;
    }

    addCenterIndicator() {
        // Center indicator
        this.juliaCenterIndicatorWrapper = document.getElementById('julia-center-coords-indicator-wrapper');
        this.juliaCenterIndicator = document.getElementById('julia-center-coords-indicator');
        this.juliaCenterIndicatorDimensions = { x: 30, y: 30 };

        this.juliaCenterIndicatorWrapper.style.width = this.juliaCenterIndicatorDimensions.x.toString();
        this.juliaCenterIndicatorWrapper.style.height = this.juliaCenterIndicatorDimensions.y.toString();

        // Adjust position of indicator on zoom
        this.canvas.addEventListener('wheel', (evt) => {
            this.updateCenterIndicator(this.currentIndicatorPos);
        });

        // Adjust position on mouse move
        this.canvas.addEventListener('mousemove', (evt) => {
            if (!this.indicatorFollowsMouse) return;
            this.updateCenterIndicator({ x: this.vp.xToCoord(evt.clientX), y: this.vp.yToCoord(evt.clientY) });
        });

        // Adjust position on pan
        this.canvas.addEventListener('mousemove', (evt) => {
            if (this.indicatorFollowsMouse || !this.panningObject.panningCanvas) return;
            this.updateCenterIndicator(this.currentIndicatorPos);
        });
    }

    updateCenterIndicator = (juliaCCoords: { x: number; y: number }) => {
        this.currentIndicatorPos = juliaCCoords;
        let xIndicator = this.vp.coordToX(juliaCCoords.x) - this.juliaCenterIndicatorDimensions.x / 2;
        let yIndicator = this.vp.coordToY(juliaCCoords.y) - this.juliaCenterIndicatorDimensions.y / 2;

        if (
            // Check if indicator is out of bounds (hide overflow)
            xIndicator - this.juliaCenterIndicatorDimensions.x < this.vp.screenStart.x ||
            xIndicator + this.juliaCenterIndicatorDimensions.x > this.vp.screenStart.x + this.vp.vWidth ||
            yIndicator - this.juliaCenterIndicatorDimensions.y < this.vp.screenStart.y ||
            yIndicator + this.juliaCenterIndicatorDimensions.y > this.vp.screenStart.y + this.vp.vHeight
        ) {
            this.juliaCenterIndicatorWrapper.style.display = 'none';
        } else {
            this.juliaCenterIndicatorWrapper.style.display = '';
        }

        this.juliaCenterIndicatorWrapper.style.left = xIndicator.toString();
        this.juliaCenterIndicatorWrapper.style.top = yIndicator.toString();
    };
}
