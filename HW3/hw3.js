"use strict";
// set up global variables 
var canvas;
var gl;

var points = [];
var colors = [];

var modelViewMatrix, projectionMatrix, modelViewMatrixLoc, projectionMatrixLoc, transformationMatrix, transformationMatrixLoc;
// global values for model view 
var theta = 0.0;
var phi = 0.0;
var radius = 3.0; // r

// lootAt function 
var eye; // use theta and phi to locate 
var at = vec3(0.0, 0.0, 0.0) // object at the origin 
var up = vec3(0.0, 1.0, 0.0) // first set up (for cross product) to y direction 

// projection global values -> project on which plane
var near = 0.3;
var far = 20;
var fovy = 45; // field of view 
var aspect = 1.0; // aspect = w/h

// states stores values of each needed projection, mouse global values
var state = {
    dragging: false, 
    mouse: {
        lastX: -1,
        lastY: -1
    },
    projection: {
        ortho: {
            state: false,
            left: -1, 
            right: 1,
            ytop: 1,
            bottom: -1,
            near: -1,
            far: 10
        },
        perspective: {
            state: true,
            // projection plane
            near: 0.3,
            far: 20,
            fovy: 45, // field of view 
            aspect: 1.0 // w/h
        }
    }
}


var NumTimesToSubdivide = 4;

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

    // Transformation Matrix 
    transformationMatrixLoc = gl.getUniformLocation(program, 'transformationMatrix');
    transformationMatrix = mat4();
    
    // ModelView and Projection Matrices
    modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
    projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');

    // Register callback functions based on moues event 
    canvas.onmouseup = mouseup;
    canvas.onmousedown = mousedown;
    canvas.onmousemove = mousemove;
    canvas.ondblclick = doubleclick;

    render();
    

};

function mousedown(event){
    var x = event.clientX;
    var y = event.clientY;
    var rect = event.target.getBoundingClientRect();

    if(rect.left <= x && rect.right > x && rect.top <= y && rect.bottom > y){
        state.mouse.lastX = x;
        state.mouse.lastY = y;
        state.dragging = true;
    }
}
function mouseup(event){
    state.dragging = false;
}

function mousemove(event){
    // Get the coordinate of user mouse
    var x = event.clientX;
    var y = event.clientY;
    // If mouse moving is detected 
    if(state.dragging){
        var factor = 10 / canvas.height;
        var dx = factor * (x - state.mouse.lastX);
        var dy = factor * (y - state.mouse.lastY);

        // Adjust phi and theta values 
        if(phi > 0) theta = theta + dx;
        else theta = theta - dx;
        
        phi = phi - dy;
        
    }
    state.mouse.lastX = x;
    state.mouse.lastY = y;
}

function doubleclick(event){
    // Zoom in 
    radius /= 1.3;
    state.projection.ortho.near /= 1.2;
}

// To put oblique projection
function translateEvent(){
    document.getElementById('translate-x').oninput = function(event){
        transformationMatrix = translate(event.target.value, 0, 0);
    }
    document.getElementById('translate-y').oninput = function(event){
        transformationMatrix = translate(0, event.target.value, 0);
    }
    document.getElementById('translate-z').oninput = function(event){
        transformationMatrix = translate(0, 0, event.target.value);
    }
    
}
// Projection Type changing 
function projectionType(){
    document.getElementById('ortho-button').onclick = function(event){
        state.projection.ortho.state = true;
        state.projection.perspective.state = false;
    }
    document.getElementById('perspective-button').onclick = function(event){
        state.projection.ortho.state = false;
        state.projection.perspective.state = true;
    }
}
// Render Function 
function render()
{   
    // Callback events registration 
    translateEvent();
    projectionType();
    document.getElementById('theta-slider').oninput = function(event){
        theta = event.target.value * Math.PI / 180.0;
    }
    document.getElementById('phi-slider').oninput = function(event){
        phi = event.target.value * Math.PI / 180.0;
    }
    document.getElementById('radius-slider').oninput = function(event){
        radius = event.target.value;
    }

    // clear buffer 
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // lookAt function 
    // Calculate the camera position based on theta and phi values 
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
    radius*Math.sin(theta)*Math.sin(phi),
    radius*Math.cos(theta));

    // at (object position) up (法向量)
    modelViewMatrix = lookAt(eye, at, up);
    
    // Projection Type changing 
    if(state.projection.perspective.state) {
        var p_state = state.projection.perspective;
        projectionMatrix = perspective(p_state.fovy, p_state.aspect, p_state.near, p_state.far);
    }
    else if (state.projection.ortho.state){
        var o_state = state.projection.ortho;
        projectionMatrix = ortho(o_state.left, o_state.right, o_state.bottom, o_state.ytop, o_state.near, o_state.far);
    }
    // Send uniform matrix back to shader 
    gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(transformationMatrix));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));


    // draw arrays 
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
    requestAnimationFrame(render); // double buffering 
}

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
    divideOrtho(vertices[0], vertices[1], vertices[2], vertices[3], vertices[4], NumTimesToSubdivide);
    // lower pyramid
    divideOrtho(vertices[5], vertices[1], vertices[2], vertices[3], vertices[4], NumTimesToSubdivide);
    
    // points.push(
    //     vec3(-1.0, -1.0, 0.0),  // Bottom left corner
    //     vec3( 1.0, -1.0, 0.0),  // Bottom right corner
    //     vec3( 1.0, -1.0, 2.0),  // Top right corner (height set to 2.0 for example)

    //     vec3(-1.0, -1.0, 0.0),  // Bottom left corner
    //     vec3( 1.0, -1.0, 2.0),
    //     vec3(-1.0, -1.0, 2.0)   // 
    // );
    // colors.push(
    //     vec3(0.8, 0.8, 0.8),
    //     vec3(0.8, 0.8, 0.8),
    //     vec3(0.8, 0.8, 0.8),
    //     vec3(0.8, 0.8, 0.8),
    //     vec3(0.8, 0.8, 0.8),
    //     vec3(0.8, 0.8, 0.8)
    // );
   
}
function triangle(a, b, c, color){
    // put each small triangle to points list -> for vertices drawing 
    // Define a color palette which is close to orange
    let color_palette = [
        vec3(1.0, 0.8, 0.6),  // Light Peach
        vec3(1.0, 0.7, 0.5),  // Peach
        vec3(1.0, 0.6, 0.4),  // Apricot
        vec3(1.0, 0.5, 0.3),  // Orange
        vec3(1.0, 0.4, 0.2),  // Tangerine
        vec3(1.0, 0.3, 0.1),  // Burnt Orange
        vec3(1.0, 0.2, 0.0),  // Dark Orange
        vec3(0.8, 0.2, 0.0)   // Rust Red
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


