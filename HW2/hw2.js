"use strict";
// set up global variables 
var canvas;
var gl;

var points = [];
var colors = [];

var angle = 0.5;
var axis = [1, 0, 0];

var slider_val = 1;
var scaler = [1, 1, 1];
var scaleMatrix;
var rotationMatrix;
var matrix; // identity matrix
var r_matrix; // rotation matrix
var s_matrix; // scale matrix

var delay = 50;
console.log(slider_val);


var NumTimesToSubdivide = 5;

window.onload = function init()
{   
    // Get html canvas element
    canvas = document.getElementById( "gl-canvas" );

    // Set up gl
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Full function to draw orthahedron with vertices
    drawOrthahedron();

    // Set up clip space and clean the canvas
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    // enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    //  Use the program 
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create a buffer object, initialize it, and associate it with attribute variables in vertex shader
    // Color buffer 
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" ); // get attribute location from program 
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 ); // tells webgl how to read the buffer data 
    gl.enableVertexAttribArray( vColor ); // enable webgl to use the butffer data

    // Position buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );


    // Transformation matrix 
    matrix = mat4();
    matrix = mult(matrix, rotate(2, axis));
    r_matrix = gl.getUniformLocation( program, "r_matrix");
    s_matrix = gl.getUniformLocation( program, "s_matrix");
    gl.uniformMatrix4fv(r_matrix, false, flatten(matrix));
    gl.uniformMatrix4fv(s_matrix, false, flatten(matrix));


    // Event Listener 
    document.getElementById( "rotate-x" ).onclick = function () {
        axis = [1, 0, 0];
        angle = 0.8;
    };
    document.getElementById( "rotate-y" ).onclick = function () {
        axis = [0, 1, 0];
        angle = 0.8;
    };
    document.getElementById( "rotate-z" ).onclick = function () {
        axis = [0, 0, 1];
        angle = 0.8;
    };

    document.getElementById("slider").onchange = function(event){
        slider_val = event.target.value * 5;
    }
    // rendering 
    render();
    
};
function drawOrthahedron(){
    // Set up vertices 
    var vertices = [
        vec3(0, 0.8, 0),    // a
        vec3(-0.5, 0, 0.5), // b
        vec3(0.5, 0, 0.5),  // c
        vec3(0.5, 0, -0.5), // d
        vec3(-0.5, 0, -0.5),// e
        vec3(0, -0.8, 0)    // f
    ];
    // draw two pyramids
    // upper pyramid 
    divideOrtho(vertices[0], vertices[1], vertices[2], vertices[3], vertices[4], 5);
    // lower pyramid
    divideOrtho(vertices[5], vertices[1], vertices[2], vertices[3], vertices[4], 5);
    console.log(points.length);

   
   
}
function triangle(a, b, c, color){
    // put each small triangle to points list -> for vertices drawing 
    // Define a color palette which is close to orange
    let color_palette = [
        vec3(1.0, 0.9, 0.7), // Cream
        vec3(1.0, 0.8, 0.6), // Light Peach
        vec3(1.0, 0.7, 0.5), // Peach
        vec3(1.0, 0.6, 0.4), // Apricot
        vec3(1.0, 0.5, 0.3), // Orange
        vec3(1.0, 0.4, 0.2), // Tangerine
        vec3(1.0, 0.3, 0.1), // Burnt Orange
        vec3(1.0, 0.2, 0.0) // Dark Orange
    ];
    points.push(a, b, c);
    // color the three points of triangle to same color 
    for(let i = 0; i < 3; i++){
        colors.push(color_palette[color]);
    }
    
}
function orthahedgon(a, b, c, d, e){
    // draw pyramid 
    triangle(a, b, c, 1); 
    triangle(a, c, d, 2);
    triangle(a, d, e, 3);
    triangle(a, e, b, 4);
    triangle(b, c, e, 5); // bottom square
    triangle(c, d, e, 5); // bottom square 

}
function divideOrtho(a, b, c, d, e, count){
    if (count == 0){ // recusive stop 
        orthahedgon(a, b, c, d, e); // draw pyramid 
    }
    else{
        // get each two edges of a pyramid middle points 
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var ad = mix(a, d, 0.5);
        var ae = mix(a, e, 0.5);
        var bc = mix(b, c, 0.5);
        var bd = mix(b, d, 0.5);
        var be = mix(b, e, 0.5);
        var cd = mix(c, d, 0.5);
        var ce = mix(c, e, 0.5);
        var de = mix(d, e, 0.5);

        --count; 
        // draw each pyramid from divide edges 
        divideOrtho(a, ab, ac, ad, ae, count);
        divideOrtho(ab, b, bc, bd, be, count);
        divideOrtho(ac, bc, c, cd, ce, count);
        divideOrtho(ad, bd, cd, d, de, count);
        divideOrtho(ae, be, ce, de, e, count);
    }
}



function render()
{   
    // clear buffer 
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // double buffering 
    // send new uniform matrix data after transformation to vertex shader uniform 
    // and regenerate a new image 
    rotationMatrix = mult(matrix, rotate(angle++, axis)); // angle keeps changing, and decided buttons  
    scaleMatrix = mult(matrix, scale(slider_val, slider_val, slider_val)); // scale matrix 
    gl.uniformMatrix4fv(r_matrix, false, flatten(rotationMatrix));
    gl.uniformMatrix4fv(s_matrix, false, flatten(scaleMatrix));

    // draw arrays 
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
    requestAnimationFrame(render); // double buffering 
}