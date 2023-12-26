export const createShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
    var shader = gl.createShader(type);
    if (shader == null) throw new Error('Error while creating shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`ERROR compliling shader of type ${type}!`, gl.getShaderInfoLog(shader));
    } else {
        // Success
        return shader;
    }
};

export const createProgram = (gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    var program = gl.createProgram();
    if (program == null) throw new Error('Error while creating program');
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
    } else if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
    } else {
        // Success
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
};

export var vertexShaderText = `#version 300 es
    precision highp float;
    in vec2 vertPosition;
    in vec3 vertColor;
    out vec3 fragColor;
    void main()
    {
        fragColor = vertColor;
        gl_Position = vec4(vertPosition, 0.0, 1.0);
    }`;

export const getFragmentShaderText = (nrIterations: number, z: string, c: string, additionalVariables: string) => {
    var baseFragmentShaderText = `#version 300 es
    precision highp float;
    in vec3 fragColor;
    out vec4 myOutputColor;
    uniform vec2 screenResolution;
    uniform float escapeRadius;
    uniform vec3 rgbColor;
    ${additionalVariables}
    uniform vec2 xBounds;
    uniform vec2 yBounds;
    void main()
    {
        // Convert position on screen to position in coordinate system, as previously done by Viewport
        float x = gl_FragCoord.x / screenResolution.x * (xBounds.y - xBounds.x) + xBounds.x;
        float y = gl_FragCoord.y / screenResolution.y * (yBounds.y - yBounds.x) + yBounds.x;
        vec2 z = ${z};
        vec2 c = ${c};
        for (float i = 0.0; i < ${nrIterations}.0; i++)
        {
            z = vec2(z.x*z.x - z.y*z.y, (z.x+z.x) * z.y) + c;
            if (z.x*z.x + z.y*z.y > escapeRadius) {
                float colVal = i + 1. - log(log(sqrt(z.x*z.x + z.y*z.y))) / log(2.0);
                colVal = colVal / ${nrIterations + 1}.0;
                myOutputColor= vec4(rgbColor * colVal, 1.0);
                return;
            }
        }
    myOutputColor = vec4(0.0, 0.0, 0.0, 1.0);
    }`;

    return baseFragmentShaderText;
};
