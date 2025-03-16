"use strict"

var canvas;
var gl;

var numTimesToSubdivide = 1; 

var points = [];
var normals = [];

var side = false;
// variables
var state = {
    ortho: {
        left: -3.0, 
        right: 3.0,
        ytop: 3.0,
        bottom: -3.0,
        near: -10,
        far: 10
    },
    lookat: {
        eye: vec3(1.0, 1.0, 1.0),
        at: vec3(0.0, 0.0, 0.0),
        up: vec3(0.0, 1.0, 0.0)
    },
    sphere: {
        radius: 1, 
        theta: 0.0, 
        phi: 0.0,
        dr: 5.0 * Math.PI / 180.0
    },
    light: {
        position: vec4(1.0, 1.0, 1.0, 0.0),
        ambient: vec4(0.2, 0.2, 0.2, 1.0),
        diffuse: vec4(1.0, 1.0, 1.0, 1.0),
        specular: vec4(1.0, 1.0, 1.0, 1.0),
    },
    material: {
        ambient: vec4(1.0, 1.0, 1.0, 1.0),
        diffuse: vec4(1.0, 0.5, 0.5, 1.0),
        specular: vec4(1.0, 1.0, 1.0, 1.0),
        shininess: 20.0
    }
};

// uniform variables
var modelViewMatrix, modelViewMatrixLoc;
var projectionMatrix, projectionMatrixLoc;
var normalMatrix, normalMatrixLoc;
var lightPositionMatrix;

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
    side = false;
    divideOrtho(vertices[0], vertices[1], vertices[2], vertices[3], vertices[4], numTimesToSubdivide);
    // lower pyramid f -> 
    side = true;
    divideOrtho(vertices[5], vertices[1], vertices[2], vertices[3], vertices[4], numTimesToSubdivide);
   
}

function triangle(a, b, c){ // f, b, c
    
    var t1 = subtract(b, a);
    var t2 = subtract(c, a);

    if(side) var normal = normalize(cross(t2, t1));
    else var normal = normalize(cross(t1, t2));
    
    normal = vec4(normal);
    normal[3] = 0.0;

    normals.push(normal, normal, normal); // Correct: Pushing normal once for each vertex
    points.push(a, b, c); // Correct: Pushing vertices
}

function orthahedgon(a, b, c, d, e){
    // draw pyramid 
    triangle(a, b, c); 
    triangle(a, c, d);
    triangle(a, d, e);
    triangle(a, e, b);
    triangle(b, c, e); // bottom square
    triangle(c, d, e); // bottom square 

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

window.onload = function init(){

    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // calculate the ambient, diffuse, and speculare for the object 
    var ambientProduct = mult(state.light.ambient, state.material.ambient);
    var diffuseProduct = mult(state.light.diffuse, state.material.diffuse);
    var specularProduct = mult(state.light.specular, state.material.specular);


    drawOrthahedron();

    // buffer set up 
    // normal buffer 
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    // position buffer 
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // uniform matrix 
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    // callback functions 
    // document.getElementById("Button0").onclick = function(){state.sphere.radius *= 2.0;};
    // document.getElementById("Button1").onclick = function(){state.sphere.radius *= 0.5;};
    document.getElementById("r-slider").oninput = function(event){
        state.sphere.radius = event.target.value
    }
    document.getElementById("theta-slider").oninput = function(event){
        state.sphere.theta = event.target.value * Math.PI / 180.0; 
    }
    document.getElementById("phi-slider").oninput = function(event){
        state.sphere.phi = event.target.value * Math.PI / 180.0; 
    }

    // pass value to fragement shader 
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,"lightPosition"),flatten(state.light.position) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"), state.material.shininess);

    render();
    

}

function render(){

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var sphere = state.sphere; 
    var projection = state.ortho;
    var look = state.lookat;
   
    // setting up the screen perspective, and let the light source turn to other angle with light position 
    look.eye = vec3(
            sphere.radius*Math.sin(sphere.theta)*Math.cos(sphere.phi),
            sphere.radius*Math.sin(sphere.theta)*Math.sin(sphere.phi), 
            sphere.radius*Math.cos(sphere.theta));

    modelViewMatrix = lookAt(look.eye, look.at , look.up);
    projectionMatrix = ortho(-2.0, 2.0, -2.0, 2.0, -5, 5);
    // normal matrix 
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    // pass to vertex shader 
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );

    gl.drawArrays( gl.TRIANGLES, 0, points.length);
    requestAnimationFrame(render); // double buffering 
}