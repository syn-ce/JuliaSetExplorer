import { FractalManager } from '../fractal/FractalManager';
import { JuliaContext } from '../fractal/JuliaContext';

var oldWidth = window.innerWidth;
var oldHeight = window.innerHeight;

const resizeWindow = (fractalManager: FractalManager, juliaPreviewContext: JuliaContext) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const mandelCenter = fractalManager.mandelContext.getCurrentCenter();
    const juliaCenter = fractalManager.juliaContext.getCurrentCenter();
    const juliaPreviewCenter = juliaPreviewContext.getCurrentCenter();

    // Resize Mandel and Julia
    fractalManager.mandelContext.resizeCanvas(0, width / 2, 0, height);
    fractalManager.juliaContext.resizeCanvas(width / 2, width, 0, height);

    // Keep original center values centered
    fractalManager.mandelContext.setCenterTo(mandelCenter.cX, mandelCenter.cY);
    fractalManager.juliaContext.setCenterTo(juliaCenter.cX, juliaCenter.cY);

    // Update center indicator
    fractalManager.mandelContext.updateCenterIndicator(fractalManager.juliaContext.juliaCCoords);

    // Resize, center preview
    juliaPreviewContext.canvas.width *= width / oldWidth;
    juliaPreviewContext.canvas.height *= height / oldHeight;
    oldWidth = width;
    oldHeight = height;

    // Keep centered on screen
    let xLeft = window.innerWidth / 2 - juliaPreviewContext.canvas.width / 2;
    let xRight = window.innerWidth / 2 + juliaPreviewContext.canvas.width / 2;
    let yBot = window.innerHeight / 2 - juliaPreviewContext.canvas.height / 2;
    let yTop = window.innerHeight / 2 + juliaPreviewContext.canvas.height / 2;
    juliaPreviewContext.resizeCanvas(xLeft, xRight, yBot, yTop);
    juliaPreviewContext.moveCanvas(document.getElementById('download-preview-canvas-border'));

    // Keep original center value centered
    juliaPreviewContext.setCenterTo(juliaPreviewCenter.cX, juliaPreviewCenter.cY);

    // Render all
    fractalManager.juliaContext.render();
    fractalManager.mandelContext.render();
    juliaPreviewContext.render();
};

export const addResizeWindow = (fractalManager: FractalManager, juliaPreviewContext: JuliaContext) =>
    (window.onresize = () => resizeWindow(fractalManager, juliaPreviewContext));
