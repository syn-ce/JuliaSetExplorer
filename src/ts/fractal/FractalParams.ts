import {RGBColor, ColorSettings} from "../utils/colorUtils";

export type FractalParams = {
    color: RGBColor,
    nrIterations: number,
    exponent: number,
    escapeRadius: number,
    juliaCoords: { x: number, y: number },
    juliaPreviewCenter: { x: number, y: number },
    zoomLevel: number,
    cpuRendering: boolean,
    colorSettings: ColorSettings
}