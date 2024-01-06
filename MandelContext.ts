import { FractalContext } from './FractalContext.js';
import { addVecs, complexExp, scaleVec } from './utils.js';
import { Viewport } from './viewport.js';

export class MandelContext extends FractalContext {
    juliaCenterIndicatorWrapper: HTMLElement;
    juliaCenterIndicator: HTMLElement;
    juliaCenterIndicatorDimensions: { x: number; y: number };
    currentIndicatorPos: { x: number; y: number }; // Used for adjusting when zooming
    indicatorFollowsMouse: boolean;

    constructor(
        canvas: HTMLCanvasElement,
        canvas2d: HTMLCanvasElement,
        width: number,
        height: number,
        screenStart: { x: number; y: number },
        fragmentShaderText: string,
        nrIterations: number
    ) {
        super(canvas, canvas2d, width, height, screenStart, fragmentShaderText, nrIterations);

        this.addCenterIndicator();
        this.setXYRenderingBounds(-1.5, 1.5, -2.1);
    }

    addCenterIndicator() {
        // Center indicator
        this.juliaCenterIndicatorWrapper = document.getElementById('julia-center-coords-indicator-wrapper');
        this.juliaCenterIndicator = document.getElementById('julia-center-coords-indicator');
        this.juliaCenterIndicatorDimensions = { x: 15, y: 15 };

        this.currentIndicatorPos = { x: 0.0, y: 0.0 };
        this.indicatorFollowsMouse = true;

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

        this.updateCenterIndicator({ x: this.currentIndicatorPos.x, y: this.currentIndicatorPos.y });
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

    getColorValueForPoint = (x: number, y: number) => {
        let z = { real: 0, imag: 0 };
        let c = { real: x, imag: y };

        for (let i = 0; i < this.nrIterations; i++) {
            z = complexExp(z.real, z.imag, this.exponent);
            z.real += c.real;
            z.imag += c.imag;

            if (z.real * z.real + z.imag * z.imag > this.escapeRadius) {
                const ismoothed =
                    i -
                    Math.log2(Math.log2(z.real * z.real + z.imag * z.imag) / Math.log2(this.escapeRadius)) /
                        Math.log2(this.exponent); // https://iquilezles.org/articles/msetsmooth
                var gray =
                    this.colorSettings[0] *
                        (i +
                            1 -
                            Math.log(Math.log(Math.sqrt(z.real * z.real + z.imag * z.imag))) /
                                Math.log(this.exponent)) +
                    (1 - this.colorSettings[0]) * i;
                gray = gray / this.nrIterations;

                const tmp = addVecs(
                    addVecs(
                        addVecs(
                            scaleVec(this.colorSettings[1], { x: gray * 4.2, y: gray * 1.2, z: gray * gray }),
                            scaleVec(this.colorSettings[2] * gray * 5.0, {
                                x: this.rgbColor.r,
                                y: this.rgbColor.g,
                                z: this.rgbColor.b,
                            })
                        ),
                        scaleVec(this.colorSettings[3], {
                            x: 0.5 + 0.5 * Math.sin(3.0 + ismoothed * this.rgbColor.r * 0.3),
                            y: 0.5 + 0.5 * Math.sin(3.0 + ismoothed * this.rgbColor.g * 0.3),
                            z: 0.5 + 0.5 * Math.sin(3.0 + ismoothed * this.rgbColor.b * 0.3),
                        })
                    ),
                    scaleVec(this.colorSettings[4], {
                        x: 0.5 + 0.5 * Math.sin(5.0 + ismoothed * 0.35 + ismoothed * this.rgbColor.r * 0.3),
                        y: 0.5 + 0.5 * Math.sin(5.0 + ismoothed * 0.35 + ismoothed * this.rgbColor.g * 0.3),
                        z: 0.5 + 0.5 * Math.sin(5.0 + ismoothed * 0.35 + ismoothed * this.rgbColor.b * 0.3),
                    })
                );

                //myOutputColor = vec4(tmp, 1.0);

                return tmp; // Lies outside
            }
        }

        return { x: 0, y: 0, z: 0 }; // Lies inside
    };
}
