"use strict";

var canvas;
var gl;

var numTimesToSubdivide = 3;

var index = 0;

var pointsArray = [];
var groundPointsArray = [];
var normalsArray = [];
var groundTexCoordsArray = [];
var groundNormalsArray = [];


var near = -10;
var far = 10;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -3.0;
var right = 3.0;
var ytop =3.0;
var bottom = -3.0;

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

var lightPosition = vec4(-20.0, 2.0, 2.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4(0.1, 0.1, 0.1, 1.0);// Moderate ambient reflection
var materialDiffuse = vec4(0.1, 0.1, 0.1, 1.0); // Strong diffuse reflection
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0); // Moderate specular reflection
var materialShininess = 100.0; // Moderate shininess for a smooth surface
var ambientColor, diffuseColor, specularColor;


var red = new Uint8Array([255, 0, 0, 255]);
var green = new Uint8Array([0, 255, 0, 255]);
var blue = new Uint8Array([0, 0, 255, 255]);
var cyan = new Uint8Array([0, 255, 255, 255]);
var magenta = new Uint8Array([255, 0, 255, 255]);
var yellow = new Uint8Array([255, 255, 0, 255]);
var black = new Uint8Array([255, 255, 255, 255]);

var cubeMap;
var groundMap;
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var normalMatrix, normalMatrixLoc;

var worldLoc, textureLoc, worldCameraPositionLoc;
var lightPositionLoc, shininessLoc;
var ambientLoc, diffuseLoc, specularLoc;

var texSize = 256;
var numChecks =8;
var c;
var image1 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            var patchx = Math.floor(i/(texSize/numChecks));
            var patchy = Math.floor(j/(texSize/numChecks));
            if(patchx%2 ^ patchy%2) c = 255;
            else c = 0;
           
            //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
            image1[4*i*texSize+4*j] = c ;
            image1[4*i*texSize+4*j+1] = c ;
            image1[4*i*texSize+4*j+2] = c ;
            image1[4*i*texSize+4*j+3] = 255;
        }
    }
    var image2 = new Uint8Array(4 * texSize * texSize);

    for (var i = 0; i < texSize; i++) {
        for (var j = 0; j < texSize; j++) {
            var index = 4 * i * texSize + 4 * j;
            image2[index] = 100;     // Red channel
            image2[index + 1] = 144; // Green channel
            image2[index + 2] = 55; // Blue channel
            image2[index + 3] = 255; // Alpha channel (opaque)
        }
    }

function configureCubeMap() {

    cubeMap = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
   
    gl.texImage2D(
        gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, texSize, texSize ,0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.texImage2D(
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, texSize, texSize,0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.texImage2D(
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, texSize, texSize ,0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.texImage2D(
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, texSize, texSize ,0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.texImage2D(
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, texSize, texSize ,0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, texSize, texSize ,0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);


}

function configureGroundMap(){
    groundMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, groundMap);
   
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize ,0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,)

}
function groundTri(a, b, c, check){
   
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

     // normals are vectors

    normalsArray.push(a[0],a[1], a[2]);
    normalsArray.push(b[0],b[1], b[2]);
    normalsArray.push(c[0],c[1], c[2]);

    // texCoordsArray.push(texCoord[texIndice[0]], texCoord[texIndice[1]], texCoord[texIndice[2]])
  
}
function squareGround(){
    var vertices = [
        vec4(-10, -1, -10, 1),
        vec4(10, -1, -10, 1),
        vec4(10, -1, 10, 1),
        vec4(-10, -1, 10, 1),
    ];
    triangle(vertices[0], vertices[1], vertices[2]);
    triangle(vertices[0], vertices[2], vertices[3]);
 
    
  
}
function triangle(a, b, c) {

    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

     // normals are vectors

    normalsArray.push(a[0],a[1], a[2]);
    normalsArray.push(b[0],b[1], b[2]);
    normalsArray.push(c[0],c[1], c[2]);

    index += 3;

}


function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
       
        
    }
    else {
        triangle( a, b, c );
        
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    // gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    tetrahedron(va, vb, vc, vd, 6);
    squareGround();

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);


    
    // Normal buffer 
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    // Position buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    // Framebuffer 
    var fb = gl.createFramebuffer();;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    var attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, groundMap, 0
    );

    


    // uniform location
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    worldLoc = gl.getUniformLocation(program, 'u_world');
    textureLoc = gl.getUniformLocation(program, 'u_texture');
    worldCameraPositionLoc = gl.getUniformLocation(program, 'u_worldCameraPosition');

    // Create a texture -> bind photo to the cube
    configureCubeMap();

    projectionMatrix = perspective(120.0, 1.0, 0.2, 2000);
    console.log(projectionMatrix);

    var cameraPosition = [0, 0, 2];
    var target = [0, 0, 0];
    var up = [0, 1, 0];

    var cameraMatrix = lookAt(cameraPosition, target, up);
    modelViewMatrix = cameraMatrix;
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];

    
    var worldMatrix = mat4();
    
    gl.uniform4fv( gl.getUniformLocation(program,
        "ambientProduct"),flatten(ambientProduct) );
     gl.uniform4fv( gl.getUniformLocation(program,
        "diffuseProduct"),flatten(diffuseProduct) );
     gl.uniform4fv( gl.getUniformLocation(program,
        "specularProduct"),flatten(specularProduct) );
    lightPositionLoc =  gl.getUniformLocation(program,
        "lightPosition");
    shininessLoc = gl.getUniformLocation(program,
        "shininess");
     
        
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
    gl.uniformMatrix4fv(worldLoc, false, flatten(worldMatrix));
    gl.uniform3fv(worldCameraPositionLoc, cameraPosition);

    gl.activeTexture( gl.TEXTURE0);
    gl.uniform1i(gl.getUniformLocation( program, "u_texture"), 0);
   

    // document.getElementById("Button0").onclick = function(){radius *= 2.0;};
    // document.getElementById("Button1").onclick = function(){radius *= 0.5;};
    document.getElementById("Button2").onclick = function(){
        materialAmbient = vec4(0.1, 0.1, 0.1, 1.0); // Moderate ambient reflection
        materialDiffuse = vec4(0.3, 0.3, 0.3, 1.0); // Strong diffuse reflection
        materialSpecular = vec4(1.0, 1.0, 1.0, 1.0); // Moderate specular reflection
        materialShininess = 100.0;
    };
    document.getElementById("Button3").onclick = function(){
        materialAmbient = vec4(0.2, 0.2, 0.2, 1.0); // Moderate ambient reflection
        materialDiffuse = vec4(0.8, 0.8, 0.8, 1.0); // Strong diffuse reflection
        materialSpecular = vec4(0.0, 0.0, 0.0, 1.0); // No specular reflection
        materialShininess = 10.0;
    };
    document.getElementById("Button4").onclick = function(){
        materialAmbient = vec4(0.1, 0.1, 0.1, 1.0); // Moderate ambient reflection
        materialDiffuse = vec4(0.1, 0.1, 0.1, 1.0); // Strong diffuse reflection
        materialSpecular = vec4(0.0, 0.0, 0.0, 1.0); // No specular reflection
        materialShininess = 50.0;
    };
    // document.getElementById("Button5").onclick = function(){phi -= dr;};

    document.getElementById('x-light').oninput = function(event){
        lightPosition[0] = event.target.value;
    }

    document.getElementById('y-light').oninput = function(event){
        lightPosition[1] = event.target.value;
    }
    document.getElementById('z-light').oninput = function(event){
        lightPosition[2] = event.target.value;
    }
    document.getElementById('d-light').oninput = function(event){
        materialShininess = event.target.value;
    }


    render();
}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform4fv(lightPositionLoc,flatten(lightPosition));
    gl.uniform1f( shininessLoc, materialShininess );

    for( var i=0; i<index; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 );

    requestAnimFrame(render);
}

