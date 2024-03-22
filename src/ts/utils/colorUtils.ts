import { randInRange } from './utils.js';

const colorSettingsAbbreviations = ['SC', 'SO', 'LC', 'NL1', 'NL2'];

export type RGBColor = { r: number; g: number; b: number };
export type ColorSettings = number[];

export const randomRGB = () => {
    return { r: randInRange(0, 255), g: randInRange(0, 255), b: randInRange(0, 255) };
};

export const hexToRGB = (hexColor: string) => {
    const r = parseInt(hexColor.substring(1, 1 + 2), 16);
    const g = parseInt(hexColor.substring(3, 3 + 2), 16);
    const b = parseInt(hexColor.substring(5, 5 + 2), 16);
    return { r: r, g: g, b: b };
};

export const RGBToHex = (rgbColor: RGBColor) => {
    return `#${componentToHex(rgbColor.r)}${componentToHex(rgbColor.g)}${componentToHex(rgbColor.b)}`;
};

export const componentToHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
};

export const normalizeRGB = (rgbColor: RGBColor) => {
    return { r: rgbColor.r / 255, g: rgbColor.g / 255, b: rgbColor.b / 255 };
};

export const denormalizeRGB = (rgbColor: RGBColor) => {
    return { r: Math.round(rgbColor.r * 255), g: Math.round(rgbColor.g * 255), b: Math.round(rgbColor.b * 255) };
};

export const getColorSettingsAbbreviations = (colorSettings: ColorSettings) => {
    return colorSettingsAbbreviations.filter((colorSettingAbbr, index) => colorSettings[index] != 0);
};

export const getColorSettingsFromAbbreviations = (colorSettingsAbbrvs: string[]) => {
    const colorSettings: ColorSettings = Array(5).fill(0);

    colorSettingsAbbrvs.forEach(
        // Set corresponding settings to 1
        (colorSettingAbbr) => (colorSettings[colorSettingsAbbreviations.indexOf(colorSettingAbbr)] = 1)
    );

    return colorSettings;
};
