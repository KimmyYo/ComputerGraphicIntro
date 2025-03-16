function showError(errorText){
    const errorBoxDiv = document.getElementById('error-box');
    const errorTextElement = document.createElement('p');
    errorTextElement.innerText = errorText;
    errorBoxDiv.appendChild(errorTextElement);
    console.log(errorText);
}


function helloTriangle(){
    /** @type {HTMLCanvasElement|null}**/
    const canvas = document.getElementById('demo-canvas');
    if(!canvas){
        showError('Cannot get canvas reference');
        return;
    }
    const gl = canvas.getContext('webgl2');
    if(!gl){
        showError('This browser doesn not support webgl2');
        return;
    }

    // 1. Initialization
    
    // Create Vertices (Points of geo)
    const triangleVertices = [
        0.0, 0.5,  // Top middle
        -0.5, -0.5, // Bottom left
        0.5, -0.5  // Bottom Right 
    ];

    // 2. Buffer Creation to CPU/GPU
    const triangleVerticesCpuBuffer = new Float32Array(triangleVertices); 

    const triangleGeoBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVerticesCpuBuffer, gl.STATIC_DRAW);


    // 3. VertexShader Creation (Draw position of geo)
    const vertexShaderSourceCode = `#version 300 es
    precision mediump float;

    in vec2 vertexPosition; 

    void main(){
        gl_Position = vec4(vertexPosition, 0.0, 1.0);
    }`;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSourceCode);
    gl.compileShader(vertexShader);
    // Check whether source code is doing correct (should be written in correct format)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        const compile_error = gl.getShaderInfoLog(vertexShader);
        showError(`Failed to COMPILE vertex shader - ${compile_error}`);
        return;
    }


    // 4. FragmentShader Creation (Shadering the actual pixel boxes)
    const fragmentShaderSourceCode = `#version 300 es
    precision mediump float;

    out vec4 outputColor;
    
    void main(){
        outputColor = vec4(0.294, 0.0, 0.51, 1.0);
    }`;

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSourceCode);
    gl.compileShader(fragmentShader);
    // Check whether source code is doing correct (should be written in correct format)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        const compile_error = gl.getShaderInfoLog(fragmentShader);
        showError(`Failed to COMPILE fragment shader - ${compile_error}`);
        return;
    }

    // 5. Combine VertexShader and FragmentShader (should be used combinely)
    const triangleShaderProgram = gl.createProgram();
    gl.attachShader(triangleShaderProgram, vertexShader);
    gl.attachShader(triangleShaderProgram, fragmentShader);
    gl.linkProgram(triangleShaderProgram);
    if(!gl.getProgramParameter(triangleShaderProgram, gl.LINK_STATUS)){
        const linkError = gl.getProgramInfoLog(triangleShaderProgram);
        showError(`Failed to LINK shader - ${linkError}`);
        return;
    }
    
    // 6. Check vertexPosition Attribute 
    const vertexPositionAttribLocation = gl.getAttribLocation(triangleShaderProgram, 'vertexPosition');
    if(vertexPositionAttribLocation < 0){
        showError('Failed to get attrib location for vertex position');
        return;
    }


    // 7. Start drawing 
    // 7(1. Output Merger - how to merge the shaded pixel fragment with the existing output image 
    
    // Set up canvas width and height with actual html canvase width and height 
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.clearColor(0.08, 0.08, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear gl buffers 


    // 7(2. Rasterizer - which pixels are part of a triangle (which part of canvase should be only focused)
    gl.viewport(0, 0, canvas.width, canvas.height);

    // 7(3. Set GPU program (vertex + fragment shader pair)
    gl.useProgram(triangleShaderProgram);
    gl.enableVertexAttribArray(vertexPositionAttribLocation);

    // 7(4. Input Assembler - how to read GPU from GPU triangle buffer (what buffer to read and how to read buffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
    gl.vertexAttribPointer(
        /* index: which attribute to use */
        vertexPositionAttribLocation,
        /* size: how many components in that attributes */
        2, 
        /* type: what is the data type stored in the GPU buffer for this attribute? */
        gl.FLOAT,
        /* normalized: determines how to convert integer into floats, if needed */
        false,
        /* stride: how many bytes to move forward in the buffer to find the same attribute for the next vertex */
        2 * Float32Array.BYTES_PER_ELEMENT,
        /* offset: how many bytes should input assembler skip into the buffer when reading atttributes? */
        0
    );

    // 7(5. Draw Call (also configure primitive assembly)
    gl.drawArrays(gl.TRIANGLES, 0, 3);




}
try {
    helloTriangle();
} catch(e) {
    showError(`Uncaught Javascript Exception: ${e}`);
}