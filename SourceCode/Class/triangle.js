
var canvas;
var gl;


var maxNumTriangles = 200;  
var maxNumVertices  = 3 * maxNumTriangles;
var index = 0;

var colors = [

    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0)   // cyan
];

window.onload = function init() {

    // Get the html-canvas element 
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    // Initial the canvas
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program ); // program in the <head> part
    
    
    // Buffer creatino: putting vetices data into buffer
    // Vertex buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    // Color buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW);
    
    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    

    canvas.addEventListener("click", function(event){

        // Bind Vertex buffer
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
        // 
        var t = vec2(2 * event.clientX / canvas.width-1, 
             2 * (canvas.height-event.clientY) / canvas.height-1);
        gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(t));

        // Bind Color Buffer
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
        t = vec4(colors[index%7]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(t));
        index++;

            // Triangle at a random place on the canvas
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        var randomPosition = vec2(Math.random() * 2 - 1, Math.random() * 2 - 1);
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, flatten(randomPosition));

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        var randomColor = vec4(colors[1]); // Ensure a different color from the mouse triangle
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(randomColor));
        index++;

        index = Math.min(index, maxNumVertices);
    } );

    render();
}


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, index);

    window.requestAnimFrame(render);
}
