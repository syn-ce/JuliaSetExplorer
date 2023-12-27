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
    uniform vec2 xBoundsMin;
    uniform vec2 xBoundsMax;
    uniform vec2 yBoundsMin;
    uniform vec2 yBoundsMax;
    uniform float exponent;

    vec2 twoSum(float a, float b)
    {
        float x = a + b;
        float b_v = x - a;
        float a_v = x - b_v;
        float b_ro = b - b_v;
        float a_ro = a - a_v;
        float y = a_ro + b_ro;
        return vec2(x,y);
    }

    vec2 split(float a, float s)
    {
        float c = (pow(2.0, s)+1.0)*a;
        float a_big = c - a;
        float a_hi = c - a_big;
        float a_lo = a - a_hi;
        return vec2(a_hi, a_lo);
    }

    vec2 twoProduct(float a, float b)
    {
        float x = a*b;
        vec2 a_hl = split(a, 16.0); // ceil(32Bits / 2) = 16
        vec2 b_hl = split(b, 16.0);
        float err1 = x - a_hl.x * b_hl.x;
        float err2 = err1 - a_hl.y * b_hl.x;
        float err3 = err2 - a_hl.x * b_hl.y;
        float y = a_hl.y * b_hl.y - err3;
        return vec2(x,y);
    }

    vec2 df64_add(vec2 a, vec2 b)
    {
        vec2 s, t;
        s = twoSum(a.x, b.x);
        t = twoSum(a.y, b.y);
        s.y += t.x;
        s = twoSum(s.x, s.y);
        s.y += t.y;
        s = twoSum(s.x, s.y);
        return s;
    }

    vec2 df64_diff(vec2 a, vec2 b)
    {
        return df64_add(a, -b);
    }

    vec2 split(float a)
    {
        float t = a * 4097.0; // (1 << 12) + 1
        float a_hi = t - (t-a);
        float a_lo = a-a_hi;
        return vec2(a_hi,a_lo);
    }

    vec4 splitComb(vec2 c)
    {
        vec2 t = c * 4097.0; // (1 << 12) + 1
        vec2 c_hi = t-(t-c);
        vec2 c_lo = c-c_hi;
        return vec4(c_hi, c_lo);
    }

    vec2 twoProd(float a, float b)
    {
        float p = a*b;
        vec2 aS = split(a);
        vec2 bS = split(b);
        float err = ((aS.x*bS.x - p) + aS.x*bS.y + aS.y*bS.x) + aS.y*bS.y;
        return vec2(p, err);
    }

    vec2 df64_mult(vec2 a, vec2 b)
    {
        vec2 p = twoProd(a.x, b.x);
        p.y += a.x * b.y;
        p.y += a.y * b.x;
        p = twoSum(p.x, p.y);
        return p;
    }

    vec2 df64_div(vec2 b, vec2 a)
    {
        float xn = 1.0/a.x;
        float yn = b.x*xn;
        vec2 diff = df64_diff(b, df64_mult(a,vec2(yn,0.0)));
        vec2 prod = df64_mult(vec2(xn,0.0), diff);
    
        return df64_add(vec2(yn,0.0), prod); 
    }

    vec2 df64_sqrt(vec2 a)
    {
        float xn = 1.0 / sqrt(a.x);
        float yn = a.y*xn;
        vec2 ynsqr = twoProd(yn, yn);
        float diff = df64_diff(a, ynsqr).x; // have a look at this again, it doesn't look right

        vec2 prod = twoProd(xn, diff) * 0.5;

        return df64_add(vec2(yn,0), prod);
    }

    bool df64_lt(vec2 a, vec2 b)
    {
        return (a.x < b.x || (a.x == b.x && a.y < b.y));
    }

    vec2 df64_expTaylor(vec2 a)
    {
        float thresh = 1.0e-20*exp(a.x);
        vec2 t,p,f,s,x,m;

        s = df64_add(vec2(1.0,0.0), a);
        p = df64_mult(a,a);
        m = vec2(2.0,0.0);
        t = p * 0.5;

        while (abs(t.x) > thresh)
        {
            s = df64_add(s,t);
            p = df64_mult(p,a);
            m.x += 1.0;
            f = df64_mult(f,m);
            t = df64_div(p,f);
        }

        return df64_add(s,t);
    }

    void main()
    {
        // Convert position on screen to position in coordinate system, as previously done by Viewport
        //float x = gl_FragCoord.x / screenResolution.x * (xBounds.y - xBounds.x) + xBounds.x;
        //float y = gl_FragCoord.y / screenResolution.y * (yBounds.y - yBounds.x) + yBounds.x;

//        vec2 xBoundsMinSplit = split(xBounds.x);
//        vec2 xBoundsMaxSplit = split(xBounds.y);
//        vec2 yBoundsMinSplit = split(yBounds.x);
//        vec2 yBoundsMaxSplit = split(yBounds.y);

        vec2 screenResXSplit = split(screenResolution.x);
        vec2 screenResYSplit = split(screenResolution.y);

        vec2 glFragCoordXSplit = split(gl_FragCoord.x);
        vec2 glFragCoordYSplit = split(gl_FragCoord.y);

        vec2 xs = df64_add(df64_mult(df64_div(glFragCoordXSplit, screenResXSplit), df64_diff(xBoundsMax, xBoundsMin)), xBoundsMin);
        vec2 ys = df64_add(df64_mult(df64_div(glFragCoordYSplit, screenResYSplit), df64_diff(yBoundsMax, yBoundsMin)), yBoundsMin);

        vec2 escapeRadiusSplit = split(escapeRadius);
        
        vec4 z = ${z};
        vec2 z_real = z.xy;
        vec2 z_imag = z.zw;
        vec4 c = ${c};

        vec2 c_real = c.xy;
        vec2 c_imag = c.zw;

        for (float i = 0.0; i < ${nrIterations + 1}.0; i++)
        {
            vec2 z_real_new = df64_add(df64_diff(df64_mult(z_real,z_real), df64_mult(z_imag,z_imag)), c_real);
            z_imag = df64_add(df64_mult(df64_add(z_real,z_real),z_imag), c_imag);
            z_real = z_real_new;
            //z = vec2(z.x*z.x - z.y*z.y, (z.x+z.x) * z.y) + c; 

            if (df64_lt(escapeRadiusSplit, df64_add(df64_mult(z_real,z_real), df64_mult(z_imag,z_imag))))
            {
                //float colVal = i + 1. - log(log(sqrt(z.x*z.x + z.y*z.y))) / log(2.0);
                //colVal = colVal / ${nrIterations + 1}.0;
                //myOutputColor= vec4(rgbColor * colVal, 1.0);

                float k = 2.0;
                float ismoothed = i - log2(log2(z_real.x*z_real.x+z_imag.x*z_imag.x)) + 4.0; // https://iquilezles.org/articles/msetsmooth
                vec3 tmp = 0.5 + 0.5*sin( 3.0 + ismoothed*0.055 + ismoothed*rgbColor);

                //float colVal = i / ${nrIterations + 1}.0;
                myOutputColor = vec4(tmp, 1.0);
                return;
            }
        }
        myOutputColor = vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec2 complexExp(float x, float y) // c = x + i*y
    {
        float arg = atan(y,x);
        float r = sqrt(x*x + y*y);
        //float real = pow((c.x*c+x + c.y*c.y),exponent.x * 0.5)*exp(-exponent.y*arg);
        // De Moivre's formula
        float r_n = pow(r,exponent);
        float real = r_n * cos(exponent*arg);
        float imag = r_n * sin(exponent*arg);
        return vec2(real, imag);
    }

//    void main2()
//    {
//        // Convert position on screen to position in coordinate system, as previously done by Viewport
//        float x = gl_FragCoord.x / screenResolution.x * (xBounds.y - xBounds.x) + xBounds.x;
//        float y = gl_FragCoord.y / screenResolution.y * (yBounds.y - yBounds.x) + yBounds.x;
//        vec2 z = ${z};
//        vec2 c = ${c};
//        for (float i = 0.0; i < ${nrIterations}.0; i++)
//        {
//            z = complexExp(z.x, z.y) + c;
//            if (z.x*z.x + z.y*z.y > escapeRadius) {
//                float colVal = i + 1. - log(log(sqrt(z.x*z.x + z.y*z.y))) / log(2.0);
//                colVal = colVal / ${nrIterations + 1}.0;
//                myOutputColor= vec4(rgbColor * colVal, 1.0);
//                return;
//            }
//        }
//    myOutputColor = vec4(0.0, 0.0, 0.0, 1.0);
//    }`;

    return baseFragmentShaderText;
};

export const split = (a: number) => {
    const splitter = (1 << 29) + 1;
    const t = a * splitter;
    const t_hi = t - (t - a);
    const t_lo = a - t_hi;
    return [t_hi, t_lo];
};
