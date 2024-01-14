export type Complex = {
    real: number;
    imag: number;
};
export type Vec3D = { x: number; y: number; z: number };

// For a zoom, we transform the entire space
export const zoomPoint = (cx: number, cy: number, z: number, a: number, b: number) => {
    return { x: a * z - z * cx + cx, y: b * z - z * cy + cy };
};

export const distance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    return Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);
};

export const limitLength = (vec2d: { x: number; y: number }, limit: number) => {
    if (vec2d.x ** 2 + vec2d.y ** 2 > limit * limit) {
        let length = Math.sqrt(vec2d.x ** 2 + vec2d.y ** 2);
        vec2d.x = (vec2d.x / length) * limit;
        vec2d.y = (vec2d.y / length) * limit;
    }
};

export const scaleVec = (scalar: number, vec3d: Vec3D) => {
    return { x: vec3d.x * scalar, y: vec3d.y * scalar, z: vec3d.z * scalar };
};

export const addVecs = (vec3d1: Vec3D, vec3d2: Vec3D) => {
    return { x: vec3d1.x + vec3d2.x, y: vec3d1.y + vec3d2.y, z: vec3d1.z + vec3d2.z };
};

// c = x + i*y
export const complexExp = (x: number, y: number, exponent: number) => {
    const arg = Math.atan2(y, x);
    const r = Math.sqrt(x * x + y * y);
    // De Moivre's formula
    const r_n = Math.pow(r, exponent);
    x = r_n * Math.cos(exponent * arg);
    y = r_n * Math.sin(exponent * arg);
    return { real: x, imag: y };
};
