var gl;
var points;

window.onload = function main(){
    // Get the html canva
    var canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );    
    if ( !gl ) { alert( "WebGL isn't available" );}     
    
    // Clear the canvas
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clear(gl.COLOR_BUFFER_BIT);


    // Shader initialization 
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Retrieve the position and color attribute locations
    var vPosition = gl.getAttribLocation(program, "a_position");
    var vColor = gl.getAttribLocation(program, 'a_color');


    // Position setup
    // Enable 
    gl.enableVertexAttribArray(vPosition);

    // Create buffer and put vertices data into buffer
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometry(gl);
    // Pointer 
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);



    // Color setup
    // Enable
    gl.enableVertexAttribArray(vColor);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    setColors(gl);
    // set pointer size to 4 due to color vertices using vec4(r, g, b, 1.0)
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);


    // Draw 
    var offset = 0;
    // The cube have 6 triangles, and each triangles have 3 points
    points = 3 * 6; 
    gl.drawArrays(gl.TRIANGLES, offset, points);


}
// Set up Position Geometry 
function setGeometry(gl){
    // Set up vertices of 6 triangles 
    var three_sqrt = Math.sqrt(3) * 0.8; // scale to 0.8 due to the limitaion of the canvas
    var cube_vertices = [
        // Upper face: 60 degrees triangles 
        vec2(0, 0),
        vec2(-three_sqrt/2, 0.4),
        vec2(0, 0.8),

        vec2(0, 0),
        vec2(three_sqrt/2, 0.4),
        vec2(0, 0.8),

        // Left face: Giving same length for two vertice lines 
        vec2(-three_sqrt/2, 0.4),
        vec2(0, 0),
        vec2(-three_sqrt/2, -0.5),

        vec2(0, 0),
        vec2(0, -0.9),
        vec2(-three_sqrt/2, -0.5),

        // Right face
        vec2(three_sqrt/2, 0.4),
        vec2(0, 0),
        vec2(three_sqrt/2, -0.5),

        vec2(0, 0),
        vec2(0, -0.9),
        vec2(three_sqrt/2, -0.5),

    ];
    // Put it buffer data 
    gl.bufferData(
        gl.ARRAY_BUFFER, 
        flatten(cube_vertices),
        gl.STATIC_DRAW
    )
}
// Set up colors 
function setColors(gl){
    var colors = [];
    var r, g, b;
    // Give each face a random color 
    for(let i = 0; i < 3; i++){
        r = Math.random();
        g = Math.random();
        b = Math.random(); 
        // two triangles -> 6 points of colors to set up
        for(let j = 0; j < 6; j++){
            colors.push(r, g, b, 1);
        }
    }
    // Put color data into color buffer
    gl.bufferData(
        gl.ARRAY_BUFFER, 
        new Float32Array(colors),
        gl.STATIC_DRAW
    );
}
 