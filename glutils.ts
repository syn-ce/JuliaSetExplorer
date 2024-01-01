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
    void main()
    {
        gl_Position = vec4(vertPosition, 0.0, 1.0);
    }`;

export const getFragmentShaderText = (nrIterations: number, z: string, c: string, additionalVariables: string) => {
    var baseFragmentShaderText = `#version 300 es
    precision highp float;
    out vec4 myOutputColor;
    uniform vec2 screenResolution;
    uniform float escapeRadius;
    uniform vec3 rgbColor;
    ${additionalVariables}
    uniform vec2 xBounds;
    uniform vec2 yBounds;
    uniform float exponent;
    uniform float colorSettings[9]; // Array of ones and zeroes, used to calc the color of a pixel
    // colorSettings[0] Enables non-smooth rendering

    vec2 complexExp(float x, float y) // c = x + i*y
    {
        float arg = atan(y,x);
        float r = sqrt(x*x + y*y);
        // De Moivre's formula
        float r_n = pow(r,exponent);
        float real = r_n * cos(exponent*arg);
        float imag = r_n * sin(exponent*arg);
        return vec2(real, imag);
    }

    void main()
    {
        // Convert position on screen to position in coordinate system, as previously done by Viewport
        float x = gl_FragCoord.x / screenResolution.x * (xBounds.y - xBounds.x) + xBounds.x;
        float y = gl_FragCoord.y / screenResolution.y * (yBounds.y - yBounds.x) + yBounds.x;
        vec2 z = ${z};
        vec2 c = ${c};
        for (float i = 0.0; i < ${nrIterations}.0; i++)
        {
            z = complexExp(z.x, z.y) + c;
            if (z.x*z.x + z.y*z.y > escapeRadius) {
                float ismoothed = i - log2(log2(z.x*z.x+z.y*z.y)/log2(escapeRadius))/log2(exponent); // https://iquilezles.org/articles/msetsmooth
                float gray = colorSettings[0] * (i + 1. - log(log(sqrt(z.x*z.x + z.y*z.y))) / log(exponent)) + colorSettings[1] * i;
                gray = gray / ${nrIterations}.0; // ((${nrIterations + 1}.0 -1.) * colorSettings[2] + 1.);

                vec3 tmp =  colorSettings[3] * vec3(rgbColor * i / ${nrIterations}.0)  + 
                            colorSettings[4] * (0.5 + 0.5*sin( 3.0 + ismoothed * rgbColor)) + 
                            colorSettings[5] * (0.5 + 0.5*sin( 3.0 + ismoothed * 0.55 + ismoothed*rgbColor)) + 
                            colorSettings[6] * (vec3(gray*4.2, gray*1.2, gray*gray)) + 
                            colorSettings[7] * (vec3(gray, gray, gray)) + 
                            colorSettings[8] * (gray * 5.0 * rgbColor);

                myOutputColor = vec4(tmp, 1.0);

                return;
            }
        }
    myOutputColor = vec4(0.0, 0.0, 0.0, 1.0);
    }`;

    return baseFragmentShaderText;
};
